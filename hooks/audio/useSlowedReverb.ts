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

  // 元の速度を保持するためのRef（今回はシンプルに1.0に戻すが、拡張性を考慮）
  const previousRateRef = useRef<number>(1.0);

  useEffect(() => {
    const engine = AudioEngine.getInstance();

    if (isSlowedReverb) {
      // 現在の速度を保存して、0.85倍に設定
      previousRateRef.current = usePlaybackRateStore.getState().rate;
      if (previousRateRef.current === 0.85) {
        // 既に0.85なら（連打などで）保存しない、あるいは1.0をデフォルトと仮定
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

      // 速度を1.0に戻す（ユーザー体験として、エフェクトOFFで通常速度に戻るのが自然）
      // もし以前の速度に戻したいなら setRate(previousRateRef.current) を使う
      setRate(1.0);
    }
  }, [isSlowedReverb, setRate]);

  // Audioソースが変わった時などにピッチ補正設定がリセットされる可能性があるため再適用
  // AudioEngine側で永続化されていない設定（HTMLAudioElementのプロパティ）を監視する必要がある
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
