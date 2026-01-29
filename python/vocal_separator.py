import os
import sys
import json
import argparse
import traceback
import urllib.parse
from audio_separator.separator import Separator


def get_optimal_separator(output_dir: str, backend: str = "auto") -> Separator:
    """
    プラットフォームと利用可能なハードウェアに基づいて最適なSeparatorを初期化する

    【Windows専用の現状】
    - 現在は use_directml=True で固定（Windows + AMD/Intel GPU専用）
    - CUDAやMacでは動作しない

    【拡張方法: クロスプラットフォーム対応】
    audio-separatorは以下のバックエンドをサポート:
    1. CUDA (NVIDIA GPU) -> use_cuda=True
    2. DirectML (Windows AMD/Intel GPU) -> use_directml=True
    3. Core ML (Apple Silicon Mac) -> use_coreml=True
    4. CPU (フォールバック) -> use_cpu=True

    優先順位の例:
    - Windows: CUDA > DirectML > CPU
    - macOS: Core ML > CPU
    - Linux: CUDA > CPU
    """
    # バックエンドが強制指定されている場合
    if backend != "auto":
        if backend == "cuda":
            print("[INFO] Using CUDA backend (forced)")
            return Separator(output_dir=output_dir, output_format="MP3", use_cuda=True)
        elif backend == "directml":
            print("[INFO] Using DirectML backend (forced)")
            return Separator(output_dir=output_dir, output_format="MP3", use_directml=True)
        elif backend == "coreml":
            print("[INFO] Using Core ML backend (forced)")
            return Separator(output_dir=output_dir, output_format="MP3", use_coreml=True)
        elif backend == "cpu":
            print("[INFO] Using CPU backend (forced)")
            return Separator(output_dir=output_dir, output_format="MP3", use_cpu=True)

    platform = sys.platform

    # Windowsの場合
    if platform == "win32":
        # まずCUDAを試す（NVIDIA GPUが最も高速）
        try:
            separator = Separator(
                output_dir=output_dir,
                output_format="MP3",
                use_cuda=True,
            )
            print("[INFO] Using CUDA backend (NVIDIA GPU)")
            return separator
        except Exception:
            pass

        # 次にDirectMLを試す（AMD/Intel GPU）
        try:
            separator = Separator(
                output_dir=output_dir,
                output_format="MP3",
                use_directml=True,
            )
            print("[INFO] Using DirectML backend (AMD/Intel GPU)")
            return separator
        except Exception:
            pass

        # 最後にCPU
        separator = Separator(
            output_dir=output_dir,
            output_format="MP3",
            use_cpu=True,
        )
        print("[INFO] Using CPU backend")
        return separator

    # macOSの場合
    elif platform == "darwin":
        # Core MLを試す（Apple Silicon: M1/M2/M3）
        try:
            separator = Separator(
                output_dir=output_dir,
                output_format="MP3",
                use_coreml=True,
            )
            print("[INFO] Using Core ML backend (Apple Silicon)")
            return separator
        except Exception:
            pass

        # Intel Macの場合はCPU
        separator = Separator(
            output_dir=output_dir,
            output_format="MP3",
            use_cpu=True,
        )
        print("[INFO] Using CPU backend (Intel Mac)")
        return separator

    # Linuxの場合
    elif platform == "linux":
        # CUDAを試す
        try:
            separator = Separator(
                output_dir=output_dir,
                output_format="MP3",
                use_cuda=True,
            )
            print("[INFO] Using CUDA backend (NVIDIA GPU)")
            return separator
        except Exception:
            pass

        # CPUフォールバック
        separator = Separator(
            output_dir=output_dir,
            output_format="MP3",
            use_cpu=True,
        )
        print("[INFO] Using CPU backend")
        return separator

    # その他のプラットフォーム
    else:
        separator = Separator(
            output_dir=output_dir,
            output_format="MP3",
            use_cpu=True,
        )
        print(f"[INFO] Unknown platform ({platform}), using CPU backend")
        return separator


def separate_vocals(
    input_audio_path, output_dir=None, model_name="UVR-MDX-NET-Voc_FT.onnx", backend="auto"
):
    """
    audio-separatorライブラリを使用してボーカルを抽出する

    【Windows専用の現状】
    - use_directml=True でAMD GPUを強制使用
    - file:// プレフィックス処理もWindowsパス前提

    【拡張方法】
    1. get_optimal_separator() を使ってプラットフォームに応じたバックエンドを選択
    2. ファイルパス処理をクロスプラットフォーム対応に
    """
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(input_audio_path)) or "."
    else:
        output_dir = os.path.abspath(output_dir)

    try:
        # プラットフォームに応じたSeparatorを取得
        separator = get_optimal_separator(output_dir, backend)

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
    # 【拡張】バックエンド強制指定オプション
    parser.add_argument(
        "--backend",
        choices=["cuda", "directml", "coreml", "cpu", "auto"],
        default="auto",
        help=(
            "Backend to use (default: auto). "
            "cuda=NVIDIA GPU, directml=Windows AMD/Intel GPU, "
            "coreml=Apple Silicon Mac, cpu=CPU only, "
            "auto=auto-detect based on platform"
        ),
    )

    args = parser.parse_args()

    input_path = args.input

    # file:// プレフィックスの除去
    # 【Windows専用の現状】
    # - Windowsドライブ文字（C:など）の処理がWindows固有
    # - input_path[2] == ":" はWindowsパス前提
    #
    # 【クロスプラットフォーム対応】
    # urllib.parse.urlparse() を使うとURLを正しく解析できる
    if input_path.startswith("file://"):
        # 標準的な方法でfile URLをパース
        parsed = urllib.parse.urlparse(input_path)
        # path部分を取得（Windowsでは先頭の/も含まれる場合がある）
        input_path = urllib.parse.unquote(parsed.path)

        # Windowsの場合、先頭の/を除去（例: /C:/path -> C:/path）
        # 【注意】この処理はWindows特有
        if sys.platform == "win32" and input_path.startswith("/") and len(input_path) > 2 and input_path[2] == ":":
            input_path = input_path[1:]

    input_path = os.path.abspath(input_path)

    result = separate_vocals(input_path, args.output_dir, args.model, args.backend)
    print(json.dumps(result))


"""
================================================================================
【Windows専用の現状とクロスプラットフォーム拡張方法】
================================================================================

■ 現在のWindows専用部分

1. バックエンド固定
   - use_directml=True でAMD/Intel GPUを強制使用
   - NVIDIA GPU (CUDA) や Mac (Core ML) では動作しない
   - コード: Separator(output_dir=..., use_directml=True)

2. ファイルパス処理
   - Windowsドライブ文字（C:など）の処理がWindows固有
   - input_path[2] == ":" はWindowsパス前提
   - file:// URLのパースがWindows向け


■ 拡張方法: CUDA対応

【前提条件】
- NVIDIA GPU (Compute Capability 3.5以上)
- CUDA Toolkit 11.8+ と cuDNN
- PyTorch with CUDA

【インストール】
```bash
pip install audio-separator[cuda]
# または
pip install onnxruntime-gpu  # CUDA対応のONNX Runtime
```

【使用方法】
```python
separator = Separator(
    output_dir=output_dir,
    output_format="MP3",
    use_cuda=True,  # CUDAを有効化
)
```

【コマンドライン】
```bash
python vocal_separator.py input.mp3 --backend cuda
```


■ 拡張方法: macOS対応 (Apple Silicon)

【前提条件】
- Apple Silicon Mac (M1/M2/M3)
- macOS 12.0+

【インストール】
```bash
pip install audio-separator[coreml]
# または
pip install onnxruntime-silicon  # Apple Silicon用
```

【使用方法】
```python
separator = Separator(
    output_dir=output_dir,
    output_format="MP3",
    use_coreml=True,  # Core MLを有効化
)
```

【コマンドライン】
```bash
python vocal_separator.py input.mp3 --backend coreml
```


■ 拡張方法: Linux対応

【前提条件】
- NVIDIA GPU + CUDA (推奨)
- または CPUのみ

【インストール】
```bash
pip install audio-separator
pip install onnxruntime-gpu  # GPU使用時
# または
pip install onnxruntime  # CPUのみ
```

【使用方法】
```python
separator = Separator(
    output_dir=output_dir,
    output_format="MP3",
    use_cuda=True,  # GPU使用時
    # use_cpu=True  # CPU使用時
)
```


■ 各バックエンドの優先順位（推奨）

Windows:
  1. CUDA (NVIDIA GPU) - 最速
  2. DirectML (AMD/Intel GPU) - 中速
  3. CPU - 最遅

macOS:
  1. Core ML (Apple Silicon) - 最速
  2. CPU - 遅い

Linux:
  1. CUDA (NVIDIA GPU) - 最速
  2. CPU - 遅い


■ 既存コードの修正ポイントまとめ

1. importに sys を追加
   - プラットフォーム検出に使用

2. get_optimal_separator() 関数を追加
   - プラットフォーム検出
   - バックエンドの自動選択
   - フォールバック処理

3. file:// URL処理を修正
   - urllib.parse.urlparse() を使用
   - Windows固有処理を条件分岐

4. コマンドライン引数に --backend を追加
   - ユーザーがバックエンドを強制指定可能


■ 依存関係のrequirements.txt例

```
# 共通
audio-separator>=0.30.0

# Windows + NVIDIA GPU
onnxruntime-gpu>=1.16.0

# Windows + AMD/Intel GPU (DirectML)
onnxruntime-directml>=1.16.0

# macOS (Apple Silicon)
onnxruntime-silicon>=1.16.0

# Linux + NVIDIA GPU
onnxruntime-gpu>=1.16.0

# CPUのみ (どのプラットフォームでも)
onnxruntime>=1.16.0
```


■ 注意事項

1. ONNX Runtimeのバージョン
   - 異なるバックエンドのONNX Runtimeは同時にインストールできない
   - 使用するバックエンドに応じて適切なパッケージを選ぶ

2. モデルファイル
   - .onnxモデルはバックエンドに依存しない
   - 同じモデルファイルをどのプラットフォームでも使用可能

3. パフォーマンス
   - CPU: 遅いがどこでも動作
   - DirectML: Windows AMD/Intel GPUで中程度
   - CUDA: NVIDIA GPUで最速
   - Core ML: Apple Siliconで最速

================================================================================
"""
