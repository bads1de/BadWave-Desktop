import { useEffect, useRef } from "react";
import useEffectStore from "@/hooks/stores/useEffectStore";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * Slowed + Reverb 効果を適用するフック
 * - 再生速度を0.85倍にする
 * - ピッチ補正を無効にする（速度低下に伴い音程も下がる）
 * - リバーブを適用する
 */
const useSlowedReverb = () => {
  const isSlowedReverb = useEffectStore((state) => state.isSlowedReverb);
  const setRate = usePlaybackRateStore((state) => state.setRate);

  // 元の速度を保持するためのRef。nullの場合は未保存（初期状態）
  const previousRateRef = useRef<number | null>(null);

  useEffect(() => {
    const engine = AudioEngine.getInstance();

    if (isSlowedReverb) {
      // 現在の速度を保存
      const currentRate = usePlaybackRateStore.getState().rate;
      
      // 既に0.85（Slowed状態）なら、誤って0.85を保存しないようにする
      if (currentRate !== 0.85) {
        previousRateRef.current = currentRate;
      } else if (previousRateRef.current === null) {
        // 現在0.85で、過去の保存値がない場合はデフォルト1.0とする
        previousRateRef.current = 1.0;
      }

      setRate(0.85);

      // ピッチ補正をOFFにして、リバーブをON
      engine.setPreservesPitch(false);
      engine.setSlowedReverbMode(true);
    } else {
      // ピッチ補正をONに戻し、リバーブをOFF
      engine.setPreservesPitch(true);
      engine.setSlowedReverbMode(false);

      // 速度を元に戻す（保存されている場合のみ）
      // これにより、初期マウント時(false)に意図せず速度が上書きされるのを防ぐ
      if (previousRateRef.current !== null) {
        setRate(previousRateRef.current);
      }
    }
  }, [isSlowedReverb, setRate]);

  // Audioソースが変わった時などにピッチ補正設定がリセットされる可能性があるため再適用
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
};

export default useSlowedReverb;