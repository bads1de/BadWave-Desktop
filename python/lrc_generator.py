import sys
import json
import librosa
import numpy as np
import torch
from transformers import AutoProcessor, AutoModelForCTC


# CTC強制アライメントの計算（簡易版）
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
    import re

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


def generate_lrc(audio_path, lyrics_text):
    try:
        # 1. 歌詞の前処理
        clean_lines_data = clean_text(lyrics_text)
        if not clean_lines_data:
            return {"status": "error", "message": "歌詞が空または無効です"}

        full_transcript = "|".join([cl for _, cl in clean_lines_data])
        # 先頭と末尾にパディング
        padded_transcript = f"|{full_transcript}|"

        # 2. モデルロード
        model_id = "facebook/wav2vec2-large-960h-lv60-self"  # 英語専用 (高精度版)
        processor = AutoProcessor.from_pretrained(model_id)
        model = AutoModelForCTC.from_pretrained(model_id)

        # 3. 音声読み込み (16kHz)
        audio, sr = librosa.load(audio_path, sr=16000)
        duration = len(audio) / sr

        # 4. 推論
        inputs = processor(
            audio, sampling_rate=16000, return_tensors="pt", padding=True
        )
        with torch.no_grad():
            logits = model(inputs.input_values).logits

        emission = torch.log_softmax(logits, dim=-1)[0].cpu().numpy()
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
        global_offset = -0.15  # 150ms早める

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


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"status": "error", "message": "引数が足りません"}))
        sys.exit(1)

    audio_path = sys.argv[1]
    lyrics_text = sys.argv[2]

    result = generate_lrc(audio_path, lyrics_text)
    print(json.dumps(result))
