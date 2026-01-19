import json
import os
import subprocess
import sys


def test_lrc_generator_direct():
    """
    python/lrc_generator.py の関数を直接テストする
    """
    from lrc_generator import clean_text, format_lrc_timestamp, generate_lrc

    # 1. clean_text のテスト
    lyrics = "[Intro]\nHello world\n[Chorus]\nBad wave"
    cleaned = clean_text(lyrics)
    assert len(cleaned) == 2
    assert cleaned[0][1] == "HELLO|WORLD"
    assert cleaned[1][1] == "BAD|WAVE"
    print("✓ clean_text passed")

    # 2. format_lrc_timestamp のテスト
    assert format_lrc_timestamp(65.5) == "[01:05.50]"
    assert format_lrc_timestamp(0) == "[00:00.00]"
    print("✓ format_lrc_timestamp passed")


if __name__ == "__main__":
    # 仮想環境のパスをsys.pathに追加してインポート可能にする
    sys.path.append(os.path.dirname(__file__))

    try:
        test_lrc_generator_direct()
        print("\nAll unit tests passed!")
    except Exception as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
