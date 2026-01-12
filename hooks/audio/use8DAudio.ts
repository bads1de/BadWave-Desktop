import { useEffect, useCallback } from "react";
import useEffectStore, {
  ROTATION_SPEED_VALUES,
  RotationSpeed,
} from "@/hooks/stores/useEffectStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * 8D Audio（自動パンニング）エフェクトを制御するフック
 * AudioEngine の 8D Audio Mode を制御する
 */
const use8DAudio = () => {
  const is8DAudioEnabled = useEffectStore((state) => state.is8DAudioEnabled);
  const rotationSpeed = useEffectStore((state) => state.rotationSpeed);
  const toggle8DAudio = useEffectStore((state) => state.toggle8DAudio);
  const setRotationSpeed = useEffectStore((state) => state.setRotationSpeed);

  // 8D Audio の有効/無効と回転速度を適用
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    if (!engine.isInitialized) return;

    const rotationPeriod = ROTATION_SPEED_VALUES[rotationSpeed];
    engine.set8DAudioMode(is8DAudioEnabled, rotationPeriod);
  }, [is8DAudioEnabled, rotationSpeed]);

  // 回転速度を変更するコールバック
  const changeRotationSpeed = useCallback(
    (speed: RotationSpeed) => {
      setRotationSpeed(speed);
    },
    [setRotationSpeed]
  );

  return {
    is8DAudioEnabled,
    rotationSpeed,
    toggle8DAudio,
    changeRotationSpeed,
  };
};

export default use8DAudio;
