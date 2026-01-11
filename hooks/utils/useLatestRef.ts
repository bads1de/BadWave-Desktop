import { useRef } from "react";

/**
 * 値を常に最新の状態で保持するRefを返すカスタムフック
 *
 * useEffect や イベントリスナー内から最新の状態を参照したい場合に使用。
 * 通常の useRef + useEffect による同期パターンを1行に簡素化する。
 *
 * @example
 * // Before (3行)
 * const isPlayingRef = useRef(isPlaying);
 * useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
 *
 * // After (1行)
 * const isPlayingRef = useLatestRef(isPlaying);
 *
 * @param value - 追跡する値
 * @returns 常に最新の値を保持するRef
 */
function useLatestRef<T>(value: T): React.RefObject<T> {
  const ref = useRef<T>(value);
  // 毎レンダリング時に同期（useEffectより前に実行される）
  ref.current = value;
  return ref;
}

export default useLatestRef;
