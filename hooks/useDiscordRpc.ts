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

      if (!song) {
        await window.electron.discord.clearActivity();
        return;
      }

      // 再生中なら終了予想時刻を計算
      // 現在時刻 + (残り時間 * 1000)
      let endTimestamp;
      if (isPlaying && duration && currentTime !== undefined) {
        const remainingTime = duration - currentTime;
        if (remainingTime > 0) {
          endTimestamp = Date.now() + remainingTime * 1000;
        }
      }

      try {
        await window.electron.discord.setActivity({
          details: song.title,
          state: `by ${song.author}`,
          largeImageKey: "logo",
          largeImageText: "BadWave",
          startTimestamp: isPlaying ? Date.now() : undefined,
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
