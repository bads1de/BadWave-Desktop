"use client";

import { useCallback, useState } from "react";

/**
 * 横スクロール領域のホバー状態を管理するフック。
 *
 * マウスが領域に入ったときだけスクロール矢印を表示する、という
 * 各ボードで重複していたパターンを共通化する。
 *
 * @returns 矢印の表示状態と、親要素に渡すイベントハンドラ
 */
export const useHoverArrows = () => {
  const [showArrows, setShowArrows] = useState(false);

  const onMouseEnter = useCallback(() => setShowArrows(true), []);
  const onMouseLeave = useCallback(() => setShowArrows(false), []);

  return { showArrows, onMouseEnter, onMouseLeave };
};

export default useHoverArrows;
