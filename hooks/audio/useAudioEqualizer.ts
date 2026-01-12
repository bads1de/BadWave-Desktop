import { useEffect } from "react";
import useEqualizerStore from "@/hooks/stores/useEqualizerStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * AudioEngineのイコライザーノードを制御するフック
 * ストアの状態変更をエンジンに反映する
 */
const useAudioEqualizer = () => {
  const isEnabled = useEqualizerStore((state) => state.isEnabled);
  const bands = useEqualizerStore((state) => state.bands);

  const engine = AudioEngine.getInstance();

  // ストアのゲイン変更を反映
  useEffect(() => {
    if (!engine.isInitialized || !engine.filters) return;

    engine.filters.forEach((filter, index) => {
      const band = bands[index];
      if (band) {
        filter.gain.value = isEnabled ? band.gain : 0;
      }
    });
  }, [bands, isEnabled, engine.isInitialized, engine.filters]);

  return {
    isInitialized: engine.isInitialized,
  };
};

export default useAudioEqualizer;
