"use client";

import { useEffect, useRef } from "react";

/**
 * モーダルが閉じられたときにフォームをリセットする。
 *
 * Radix の閉じるボタン経由だけでなく、ミューテーションの onSuccess が
 * ストアを直接 `onClose()` した場合もリセットされるようにする。
 * 初回マウント時（閉じた状態でマウントされた場合）はリセットしない。
 *
 * @param isOpen モーダルの開閉状態
 * @param reset react-hook-form の reset 関数
 */
export const useResetOnClose = (isOpen: boolean, reset: () => void): void => {
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      reset();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, reset]);
};

export default useResetOnClose;
