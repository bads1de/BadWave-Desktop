import toast from "react-hot-toast";

interface AudioErrorHandlerOptions {
  maxConsecutiveErrors: number;
  skipDelayMs: number;
  setIsPlaying: (playing: boolean) => void;
  onPlayNext: () => void;
}

/**
 * オーディオエラーの処理を担当する純粋関数
 * useAudioPlayer からエラーハンドリングロジックを分離してテスト可能にする
 */
export function createAudioErrorHandler(options: AudioErrorHandlerOptions) {
  const { maxConsecutiveErrors, skipDelayMs, setIsPlaying, onPlayNext } = options;
  let consecutiveErrors = 0;

  return {
    handleError() {
      consecutiveErrors++;
      setIsPlaying(false);

      if (consecutiveErrors < maxConsecutiveErrors) {
        // まだ閾値未満 → 次曲にスキップ
        setTimeout(() => {
          onPlayNext();
        }, skipDelayMs);
      } else {
        // 閾値到達 → 停止してトースト通知
        toast.error("連続して再生エラーが発生しました。ファイルが移動・削除された可能性があります。", {
          duration: 5000,
          style: {
            background: "#1a1a2e",
            color: "#e94560",
            border: "1px solid #e94560",
          },
        });
      }
    },

    resetErrors() {
      consecutiveErrors = 0;
    },

    getErrorCount() {
      return consecutiveErrors;
    },
  };
}
