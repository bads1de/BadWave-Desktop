import { useEffect } from "react";
import useEffectStore from "@/hooks/stores/useEffectStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * Lo-Fi / Vintage Radio モードを制御するフック
 * AudioEngine の Lo-Fi Mode を制御する
 */
const useLoFiAudio = () => {
  const isLoFiEnabled = useEffectStore((state) => state.isLoFiEnabled);
  const toggleLoFi = useEffectStore((state) => state.toggleLoFi);

  // Lo-Fi モードの有効/無効を適用
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    if (!engine.isInitialized) return;

    engine.setLoFiMode(isLoFiEnabled);
  }, [isLoFiEnabled]);

  return {
    isLoFiEnabled,
    toggleLoFi,
  };
};

export default useLoFiAudio;
