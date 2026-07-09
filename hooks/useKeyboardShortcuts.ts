import { useEffect, useState, useCallback } from "react";
import { AudioEngine } from "@/libs/audio/AudioEngine";
import usePlayer from "@/hooks/player/usePlayer";
import useVolumeStore from "@/hooks/stores/useVolumeStore";

const VOLUME_STEP = 0.05;
const SEEK_STEP = 5;

export interface ShortcutDefinition {
  keys: string;
  description: string;
}

export const KEYBOARD_SHORTCUTS: ShortcutDefinition[] = [
  { keys: "Space / K", description: "再生 / 一時停止" },
  { keys: "← / J", description: "5秒戻る" },
  { keys: "→ / L", description: "5秒進む" },
  { keys: "↑", description: "音量を上げる" },
  { keys: "↓", description: "音量を下げる" },
  { keys: "M", description: "ミュート切り替え" },
  { keys: "N", description: "次の曲" },
  { keys: "P", description: "前の曲" },
  { keys: "S", description: "シャッフル切り替え" },
  { keys: "R", description: "リピート切り替え" },
  { keys: "?", description: "この一覧を表示" },
];

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
};

/**
 * グローバルなキーボードショートカットを管理するフック
 * デスクトップ（Web / Electron）の両方で共通して利用される
 */
export const useKeyboardShortcuts = () => {
  const [showHelp, setShowHelp] = useState(false);

  const getActiveAudio = useCallback((): HTMLAudioElement | null => {
    return AudioEngine.getInstance().audio;
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ヘルプを開いていても Esc で閉じられるように先に処理
      if (e.key === "Escape") {
        setShowHelp(false);
        return;
      }

      // ブラウザ/OS のショートカットを妨げない
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // 入力中はショートカットを無効化
      if (isEditableTarget(e.target)) return;

      const audio = getActiveAudio();
      const player = usePlayer.getState();
      const volumeStore = useVolumeStore.getState();

      switch (e.key) {
        case " ":
        case "k":
        case "K": {
          if (audio) {
            if (audio.paused) audio.play().catch(() => {});
            else audio.pause();
          }
          e.preventDefault();
          break;
        }
        case "ArrowLeft":
        case "j":
        case "J": {
          if (audio && !Number.isNaN(audio.duration)) {
            audio.currentTime = Math.max(0, audio.currentTime - SEEK_STEP);
          }
          e.preventDefault();
          break;
        }
        case "ArrowRight":
        case "l":
        case "L": {
          if (audio && !Number.isNaN(audio.duration)) {
            audio.currentTime = Math.min(
              audio.duration,
              audio.currentTime + SEEK_STEP
            );
          }
          e.preventDefault();
          break;
        }
        case "ArrowUp": {
          volumeStore.setVolume(volumeStore.volume + VOLUME_STEP);
          e.preventDefault();
          break;
        }
        case "ArrowDown": {
          volumeStore.setVolume(volumeStore.volume - VOLUME_STEP);
          e.preventDefault();
          break;
        }
        case "m":
        case "M": {
          if (audio) audio.muted = !audio.muted;
          e.preventDefault();
          break;
        }
        case "n":
        case "N": {
          const next = player.getNextSongId();
          if (next) player.setId(next);
          e.preventDefault();
          break;
        }
        case "p":
        case "P": {
          const prev = player.getPreviousSongId();
          if (prev) player.setId(prev);
          e.preventDefault();
          break;
        }
        case "s":
        case "S": {
          player.toggleShuffle();
          e.preventDefault();
          break;
        }
        case "r":
        case "R": {
          player.toggleRepeat();
          e.preventDefault();
          break;
        }
        case "?": {
          setShowHelp((prev) => !prev);
          e.preventDefault();
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [getActiveAudio]);

  return { showHelp, setShowHelp };
};

export default useKeyboardShortcuts;
