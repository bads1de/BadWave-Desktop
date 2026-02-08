import { useEffect } from "react";
import { mediaControls } from "@/libs/electron";

interface UseMediaControlProps {
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Electronからのメディアコントロールイベント（ミニプレイヤー含む）をハンドリングするフック
 */
export function useMediaControl({
  onPlayPause,
  onNext,
  onPrevious,
}: UseMediaControlProps) {
  useEffect(() => {
    // Electronのメディアコントロールイベントを受け取るリスナーを登録
    const unsubscribe = mediaControls.onMediaControl((action) => {
      // console.log("メディアコントロールイベントを受信:", action); // ログ削減

      switch (action) {
        case "play-pause":
          onPlayPause();
          break;
        case "next":
          onNext();
          break;
        case "previous":
          onPrevious();
          break;
        default:
          console.warn("未知のメディアコントロールアクション:", action);
      }
    });

    // コンポーネントのアンマウント時にリスナーを解除
    return () => {
      unsubscribe();
    };
  }, [onPlayPause, onNext, onPrevious]);
}
