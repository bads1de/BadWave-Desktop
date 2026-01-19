import os
import subprocess
import json
import sys


def test_vocal_separation():
    # パスの設定
    current_dir = os.path.dirname(os.path.abspath(__file__))
    python_dir = os.path.join(current_dir, "..")
    venv_python = os.path.join(python_dir, "venv", "Scripts", "python.exe")
    script_path = os.path.join(python_dir, "vocal_separator.py")
    audio_path = os.path.join(python_dir, "audio.mp3")

    print(f"Testing vocal separation with {audio_path}...")

    if not os.path.exists(audio_path):
        print(f"Error: audio.mp3 not found at {audio_path}")
        return

    # コマンドの実行
    try:
        process = subprocess.Popen(
            [venv_python, script_path, audio_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",  # Windowsでのエンコーディング対応
        )

        stdout, stderr = process.communicate()

        if process.returncode != 0:
            print(f"Process failed with return code {process.returncode}")
            print(f"Stderr: {stderr}")
            return

        try:
            result = json.loads(stdout.strip())
            print(
                "Separation result:", json.dumps(result, indent=2, ensure_ascii=False)
            )

            if result.get("status") == "success":
                vocal_path = result.get("vocal_path")
                if vocal_path and os.path.exists(vocal_path):
                    print(f"Success! Vocals saved to: {vocal_path}")
                else:
                    print(f"Error: Vocal file not found at {vocal_path}")
            else:
                print(f"Separation failed: {result.get('message')}")

        except json.JSONDecodeError:
            print("Failed to parse JSON output from script")
            print("Stdout:", stdout)

    except Exception as e:
        print(f"An error occurred during testing: {e}")


if __name__ == "__main__":
    test_vocal_separation()
