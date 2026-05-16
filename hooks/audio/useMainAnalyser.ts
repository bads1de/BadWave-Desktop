import { useEffect, useState, useRef } from "react";
import { AudioEngine } from "@/libs/audio/AudioEngine";

/**
 * メイン AudioEngine の AnalyserNode と再生状態を公開するフック
 * 右サイドバーのビジュアライザー用
 */
const useMainAnalyser = () => {
  const engine = AudioEngine.getInstance();
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    // AudioEngine が未初期化なら初期化
    if (!engine.isInitialized) {
      engine.initialize();
    }

    setAnalyser(engine.analyser);

    const audio = engine.audio;
    if (!audio) return;

    // 初期状態
    setIsPlaying(!audio.paused);

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [engine]);

  return { analyser, isPlaying };
};

export default useMainAnalyser;
