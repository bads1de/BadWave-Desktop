import { useEffect } from "react";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import useNightCoreStore from "@/hooks/stores/useNightCoreStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

const NIGHTCORE_RATE = 1.35;

/**
 * AudioEngineのaudio要素に再生速度を適用するフック
 * NightCoreモードが有効な場合は1.35倍の再生速度を適用する
 */
const usePlaybackRate = () => {
  const rate = usePlaybackRateStore((state) => state.rate);
  const isNightCore = useNightCoreStore((state) => state.isEnabled);

  const effectiveRate = isNightCore ? NIGHTCORE_RATE : rate;

  const engine = AudioEngine.getInstance();
  const audio = engine.audio;

  // 再生速度を適用
  useEffect(() => {
    if (!audio) return;
    audio.playbackRate = effectiveRate;
  }, [audio, effectiveRate]);

  // ソース変更時に再生速度を再適用
  useEffect(() => {
    if (!audio) return;

    const handleDurationChange = () => {
      audio.playbackRate = effectiveRate;
    };

    audio.addEventListener("durationchange", handleDurationChange);
    return () => {
      audio.removeEventListener("durationchange", handleDurationChange);
    };
  }, [audio, effectiveRate]);

  return { rate: effectiveRate, isNightCore };
};

export default usePlaybackRate;
