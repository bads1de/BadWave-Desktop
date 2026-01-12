import { useEffect } from "react";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * AudioEngineのaudio要素に再生速度を適用するフック
 */
const usePlaybackRate = () => {
  const rate = usePlaybackRateStore((state) => state.rate);

  const engine = AudioEngine.getInstance();
  const audio = engine.audio;

  // 再生速度を適用
  useEffect(() => {
    if (!audio) return;
    audio.playbackRate = rate;
  }, [audio, rate]);

  // ソース変更時に再生速度を再適用
  useEffect(() => {
    if (!audio) return;

    const handleDurationChange = () => {
      audio.playbackRate = rate;
    };

    audio.addEventListener("durationchange", handleDurationChange);
    return () => {
      audio.removeEventListener("durationchange", handleDurationChange);
    };
  }, [audio, rate]);

  return { rate };
};

export default usePlaybackRate;
