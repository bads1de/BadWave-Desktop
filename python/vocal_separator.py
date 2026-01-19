import os
import json
import argparse
import traceback
from audio_separator.separator import Separator


def separate_vocals(
    input_audio_path, output_dir=None, model_name="UVR-MDX-NET-Voc_FT.onnx"
):
    """
    audio-separatorライブラリを使用してボーカルを抽出する
    """
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(input_audio_path)) or "."
    else:
        output_dir = os.path.abspath(output_dir)

    # 初期化
    # AMD GPU (DirectML) を優先的に使用、失敗した場合はCPU
    try:
        separator = Separator(
            output_dir=output_dir, output_format="MP3", use_directml=True
        )

        # モデルのロード
        # MDX23C-InstVoc-HQ はボーカルとインストを高品質に分離するSOTAモデルの一つ
        separator.load_model(model_name)

        # 分離実行
        # outputs[0] が通常ボーカル、[1] がインストゥルメンタル
        output_files = separator.separate(input_audio_path)

        vocal_path = None
        instrumental_path = None

        # ファイル名を特定 (audio-separatorはデフォルトで {input}_{model}_Vocals.mp3 のような名前を付ける)
        for file in output_files:
            if "Vocals" in file:
                vocal_path = os.path.join(output_dir, file)
            elif "Instrumental" in file:
                instrumental_path = os.path.join(output_dir, file)

        return {
            "status": "success",
            "vocal_path": vocal_path,
            "instrumental_path": instrumental_path,
            "output_files": output_files,
        }

    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Vocal Separation using audio-separator"
    )
    parser.add_argument("input", help="Path to input audio file")
    parser.add_argument(
        "--model",
        default="UVR-MDX-NET-Voc_FT.onnx",
        help="Model name (default: UVR-MDX-NET-Voc_FT.onnx)",
    )
    parser.add_argument("--output_dir", help="Output directory")

    args = parser.parse_args()

    input_path = args.input
    # file:// プレフィックスの除去 (Windows/Electron対策)
    if input_path.startswith("file://"):
        input_path = input_path.replace("file://", "")
        if input_path.startswith("/") and input_path[2] == ":":
            input_path = input_path[1:]
        import urllib.parse

        input_path = urllib.parse.unquote(input_path)
    input_path = os.path.abspath(input_path)

    result = separate_vocals(input_path, args.output_dir, args.model)
    print(json.dumps(result))
