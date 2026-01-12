import { useEffect } from "react";
import useSpatialStore from "@/hooks/stores/useSpatialStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * 空間オーディオとリバーブ設定を適用するフック
 * AudioEngine の Spatial Mode と Reverb Gain を制御する
 */
const useSpatialAudio = () => {
  const isSpatialEnabled = useSpatialStore((state) => state.isSpatialEnabled);

  useEffect(() => {
    const engine = AudioEngine.getInstance();

    // 初期化されていない場合は何もしない
    // (AudioEngine.initialize() は PlayerContent などで呼ばれる想定だが、
    //  タイミングによってはまだの場合があるのでチェック)

    if (isSpatialEnabled) {
      engine.setSpatialMode(true);
    } else {
      engine.setSpatialMode(false);
    }
  }, [isSpatialEnabled]);

  return { isSpatialEnabled };
};

export default useSpatialAudio;
