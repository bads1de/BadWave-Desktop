import { useEffect, useRef, useCallback } from "react";
import useEffectStore, {
  ROTATION_SPEED_VALUES,
  RotationSpeed,
} from "@/hooks/stores/useEffectStore";
import useSpatialStore from "@/hooks/stores/useSpatialStore";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * オーディオエフェクト全般を管理する統合フック
 * - Spatial Audio (空間オーディオ)
 * - Slowed + Reverb
 * - 8D Audio
 * - Lo-Fi Mode
 */
const useAudioEffects = () => {
  // Stores
  const {
    isSlowedReverb,
    toggleSlowedReverb,
    is8DAudioEnabled,
    rotationSpeed,
    toggle8DAudio,
    setRotationSpeed,
    isLoFiEnabled,
    toggleLoFi,
  } = useEffectStore();

  const { isSpatialEnabled, toggleSpatialEnabled } = useSpatialStore();
  const setRate = usePlaybackRateStore((state) => state.setRate);

  // --- Slowed + Reverb Logic ---
  const previousRateRef = useRef<number | null>(null);

  useEffect(() => {
    const engine = AudioEngine.getInstance();

    if (isSlowedReverb) {
      const currentRate = usePlaybackRateStore.getState().rate;
      if (currentRate !== 0.85) {
        previousRateRef.current = currentRate;
      } else if (previousRateRef.current === null) {
        previousRateRef.current = 1.0;
      }

      setRate(0.85);
      engine.setPreservesPitch(false);
      engine.setSlowedReverbMode(true);
    } else {
      engine.setPreservesPitch(true);
      engine.setSlowedReverbMode(false);

      if (previousRateRef.current !== null) {
        setRate(previousRateRef.current);
      }
    }
  }, [isSlowedReverb, setRate]);

  // ピッチ補正の再適用 (Source変更時など)
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    const audio = engine.audio;
    if (!audio) return;

    const handleDurationChange = () => {
      if (isSlowedReverb) {
        engine.setPreservesPitch(false);
      } else {
        engine.setPreservesPitch(true);
      }
    };

    audio.addEventListener("durationchange", handleDurationChange);
    return () => {
      audio.removeEventListener("durationchange", handleDurationChange);
    };
  }, [isSlowedReverb]);

  // --- Spatial Audio Logic ---
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    engine.setSpatialMode(isSpatialEnabled);
  }, [isSpatialEnabled]);

  // --- 8D Audio Logic ---
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    if (!engine.isInitialized) return;

    const rotationPeriod = ROTATION_SPEED_VALUES[rotationSpeed];
    engine.set8DAudioMode(is8DAudioEnabled, rotationPeriod);
  }, [is8DAudioEnabled, rotationSpeed]);

  const change8DRotationSpeed = useCallback(
    (speed: RotationSpeed) => {
      setRotationSpeed(speed);
    },
    [setRotationSpeed]
  );

  // --- Lo-Fi Logic ---
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    if (!engine.isInitialized) return;

    engine.setLoFiMode(isLoFiEnabled);
  }, [isLoFiEnabled]);

  return {
    // Spatial
    isSpatialEnabled,
    toggleSpatialEnabled,
    
    // Slowed + Reverb
    isSlowedReverb,
    toggleSlowedReverb,
    
    // 8D Audio
    is8DAudioEnabled,
    rotationSpeed,
    toggle8DAudio,
    change8DRotationSpeed,
    
    // Lo-Fi
    isLoFiEnabled,
    toggleLoFi,
  };
};

export default useAudioEffects;
