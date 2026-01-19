import sys
import json
import re
import os
import gc
import librosa
import numpy as np
import torch
import torch_directml
from transformers import AutoProcessor, AutoModelForCTC


# CTC強制アライメントの計算
def get_trellis(emission, tokens, blank_id=0):
    num_frame = len(emission)
    num_tokens = len(tokens)
    trellis = np.full((num_frame, num_tokens), -np.inf)

    # 初期条件
    cumsum = 0
    for t in range(num_frame):
        cumsum += emission[t][blank_id]
        trellis[t][0] = cumsum

    for t in range(num_frame - 1):
        p_stay = emission[t][blank_id]
        for j in range(1, num_tokens):
            p_change = emission[t][tokens[j]]
            stay_score = trellis[t][j] + p_stay
            change_score = trellis[t][j - 1] + p_change
            trellis[t + 1][j] = max(stay_score, change_score)
    return trellis


def backtrack(trellis, emission, tokens, blank_id=0):
    t, j = trellis.shape[0] - 1, trellis.shape[1] - 1
    path = []

    # 最後の点
    path.append((j, t, np.exp(emission[t][blank_id])))

    while j > 0:
        if t <= 0:
            break
        p_stay = emission[t - 1][blank_id]
        p_change = emission[t - 1][tokens[j]]
        stay_score = trellis[t - 1][j] + p_stay
        change_score = trellis[t - 1][j - 1] + p_change

        t -= 1
        if change_score > stay_score:
            j -= 1

        prob = np.exp(change_score if change_score > stay_score else stay_score)
        path.append((j, t, prob))

    while t > 0:
        path.append((j, t - 1, np.exp(emission[t - 1][blank_id])))
        t -= 1

    return path[::-1]


def merge_repeats(path, transcript):
    i1 = 0
    segments = []
    while i1 < len(path):
        i2 = i1
        while i2 < len(path) and path[i1][0] == path[i2][0]:
            i2 += 1
        score = sum(p[2] for p in path[i1:i2]) / (i2 - i1)
        segments.append(
            {
                "label": transcript[path[i1][0]],
                "start": path[i1][1],
                "end": path[i2 - 1][1] + 1,
                "score": score,
            }
        )
        i1 = i2
    return segments


def merge_words(segments, separator="|"):
    words = []
    i1, i2 = 0, 0
    while i1 < len(segments):
        if i2 >= len(segments) or segments[i2]["label"] == separator:
            if i1 != i2:
                segs = segments[i1:i2]
                word = "".join(s["label"] for s in segs)
                word_start = segs[0]["start"]
                word_end = segs[-1]["end"]
                score = sum(s["score"] * (s["end"] - s["start"]) for s in segs) / (
                    word_end - word_start
                )
                words.append(
                    {"word": word, "start": word_start, "end": word_end, "score": score}
                )
            i1 = i2 + 1
            i2 = i1
        else:
            i2 += 1
    return words


def clean_text(text):

    # セクションヘッダー除外
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    lines = [
        line for line in lines if not (line.startswith("[") and line.endswith("]"))
    ]
    lines = [
        line for line in lines if not (line.startswith("「") and line.endswith("」"))
    ]

    clean_lines = []
    for line in lines:
        cleaned = re.sub(r"[^a-zA-Z\s\']", "", line)
        cleaned = re.sub(r"\s+", "|", cleaned).strip("|").upper()
        if cleaned:
            clean_lines.append((line, cleaned))
    return clean_lines


def format_lrc_timestamp(seconds):
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"[{minutes:02d}:{secs:05.2f}]"


def generate_lrc(audio_path, lyrics_text, use_vocal_separation=True):
    """
    音声ファイルと歌詞テキストからLRCファイルを生成する

    Args:
        audio_path: 音声ファイルのパス
        lyrics_text: 歌詞テキスト
        use_vocal_separation: ボーカル抽出を行うかどうか (デフォルト: True)
    """
    vocal_path = None
    instrumental_path = None
    try:
        # 0. ボーカル抽出（精度向上のため）- 別プロセスで実行してGPUメモリを解放
        if use_vocal_separation:
            print("[LRC] ボーカル抽出を開始...", file=sys.stderr)

            # vocal_separator.py を別プロセスで実行（GPUメモリ解放のため）
            import subprocess

            script_dir = os.path.dirname(os.path.abspath(__file__))
            separator_script = os.path.join(script_dir, "vocal_separator.py")
            python_exe = sys.executable

            result = subprocess.run(
                [python_exe, separator_script, audio_path],
                capture_output=True,
                text=True,
            )

            if result.returncode == 0:
                try:
                    sep_result = json.loads(result.stdout.strip())
                    if sep_result["status"] == "success" and sep_result.get(
                        "vocal_path"
                    ):
                        vocal_path = sep_result["vocal_path"]
                        instrumental_path = sep_result.get("instrumental_path")
                        audio_path = vocal_path
                        print(f"[LRC] ボーカル抽出完了: {vocal_path}", file=sys.stderr)
                    else:
                        print(
                            f"[LRC] ボーカル抽出失敗、元音源を使用: {sep_result.get('message', '')}",
                            file=sys.stderr,
                        )
                except json.JSONDecodeError:
                    print(
                        "[LRC] ボーカル抽出の出力解析失敗、元音源を使用",
                        file=sys.stderr,
                    )
            else:
                print("[LRC] ボーカル抽出プロセスエラー、元音源を使用", file=sys.stderr)

            # サブプロセス終了後にGCを実行
            gc.collect()

        # 1. 歌詞の前処理
        clean_lines_data = clean_text(lyrics_text)
        if not clean_lines_data:
            return {"status": "error", "message": "歌詞が空または無効です"}

        full_transcript = "|".join([cl for _, cl in clean_lines_data])
        # 先頭と末尾にパディング
        padded_transcript = f"|{full_transcript}|"

        # 2. モデルロード (精度向上のため Large モデルを使用)
        model_id = "facebook/wav2vec2-large-960h-lv60-self"
        processor = AutoProcessor.from_pretrained(model_id)

        # DirectMLデバイスの設定
        device = torch_directml.device()
        print(f"[LRC] Using device: {device}", file=sys.stderr)

        model = AutoModelForCTC.from_pretrained(model_id).to(device)

        # 3. 音声読み込み (16kHz)
        audio, sr = librosa.load(audio_path, sr=16000)
        duration = len(audio) / sr

        # 4. チャンク分割推論（長い音声のGPUメモリ対策）
        chunk_length_samples = 30 * sr  # 30秒
        overlap_samples = 2 * sr  # 2秒オーバーラップ

        all_emissions = []
        pos = 0

        print(f"[LRC] 音声長: {duration:.1f}秒、チャンク処理開始...", file=sys.stderr)

        while pos < len(audio):
            end = min(pos + chunk_length_samples, len(audio))
            chunk = audio[pos:end]

            inputs = processor(
                chunk, sampling_rate=16000, return_tensors="pt", padding=True
            )
            input_values = inputs.input_values.to(device)

            with torch.no_grad():
                logits = model(input_values).logits

            chunk_emission = torch.log_softmax(logits, dim=-1)[0].cpu().numpy()

            # オーバーラップ部分を除去（最初のチャンク以外）
            if pos > 0 and len(all_emissions) > 0:
                overlap_frames = int(
                    overlap_samples / sr * (chunk_emission.shape[0] / (len(chunk) / sr))
                )
                chunk_emission = chunk_emission[overlap_frames:]

            all_emissions.append(chunk_emission)
            pos += chunk_length_samples - overlap_samples

            # メモリ解放
            del input_values, logits
            gc.collect()

        # 結合
        emission = np.concatenate(all_emissions, axis=0)
        num_frames = emission.shape[0]
        ratio = duration / num_frames

        # 5. アライメント計算
        vocab = processor.tokenizer.get_vocab()
        token_to_id = {t: i for t, i in vocab.items()}

        tokens = []
        for c in padded_transcript:
            tid = token_to_id.get(c, token_to_id.get("<unk>", 0))
            tokens.append(tid)

        trellis = get_trellis(emission, tokens)
        path = backtrack(trellis, emission, tokens)
        segments = merge_repeats(path, padded_transcript)
        word_segments = merge_words(segments)

        # 6. LRC構成
        lrc_lines = ["[by:BadWave AI]"]
        current_word_idx = 1  # パディングの|を飛ばす
        global_offset = -0.3  # 300ms早める (同期感を向上)

        for original_line, clean_line in clean_lines_data:
            words_in_line = clean_line.count("|") + 1
            if current_word_idx < len(word_segments):
                start_frame = word_segments[current_word_idx]["start"]
                start_time = max(0, start_frame * ratio + global_offset)
                lrc_lines.append(f"{format_lrc_timestamp(start_time)}{original_line}")
            current_word_idx += words_in_line

        return {"status": "success", "lrc": "\n".join(lrc_lines)}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        # 生成したボーカル/インストゥルメンタルファイルをクリーンアップ
        for path in [vocal_path, instrumental_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass  # クリーンアップ失敗は無視


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"status": "error", "message": "引数が足りません"}))
        sys.exit(1)

    audio_path = sys.argv[1]
    lyrics_arg = sys.argv[2]

    # ファイルパスの場合は内容を読み込む
    if os.path.isfile(lyrics_arg):
        with open(lyrics_arg, "r", encoding="utf-8") as f:
            lyrics_text = f.read()
    else:
        lyrics_text = lyrics_arg

    result = generate_lrc(audio_path, lyrics_text)
    print(json.dumps(result))
