import { useEffect } from "react";
import { Song } from "@/types";

interface UseDiscordRpcProps {
  song?: Song;
  isPlaying: boolean;
  duration?: number;
  currentTime?: number;
}

export const useDiscordRpc = ({
  song,
  isPlaying,
  duration,
  currentTime,
}: UseDiscordRpcProps) => {
  useEffect(() => {
    const updateActivity = async () => {
      // Electron環境でない、またはDiscord APIがない場合はスキップ
      if (typeof window === "undefined" || !window.electron?.discord) return;

      // もし曲がなければ、活動をクリアして終了
      if (!song) {
        await window.electron.discord.clearActivity();
        return;
      }

      // 再生中なら終了予想時刻を計算
      // 現在時刻 + (残り時間 * 1000)
      let endTimestamp: number | undefined = undefined;
      if (isPlaying && duration && currentTime !== undefined) {
        const remainingTime = duration - currentTime;

        if (remainingTime > 0) {
          endTimestamp = Date.now() + remainingTime * 1000;
        }
      }

      try {
        // Discord活動を更新
        await window.electron.discord.setActivity({
          details: song.title,
          state: `by ${song.author}`,
          largeImageKey: "logo",
          largeImageText: "BadWave",
          startTimestamp: isPlaying ? undefined : undefined, // ElapsedよりもRemainingを優先
          endTimestamp: isPlaying ? endTimestamp : undefined,
          instance: false,
        });
      } catch (error) {
        console.error("Failed to update Discord activity:", error);
      }
    };

    // デバウンス処理を入れるのが望ましいが、isPlayingとsongが変わった時だけ更新するようにすれば
    // 頻繁な更新は防げる（currentTimeは依存配列に入れない）
    updateActivity();
  }, [song, isPlaying]); // currentTime, duration は依存配列に入れない（頻繁な更新を避けるため）
};
