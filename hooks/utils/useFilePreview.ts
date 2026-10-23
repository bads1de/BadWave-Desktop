"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseFilePreviewResult {
  /** プレビュー用 Blob URL（未選択なら null） */
  previewUrl: string | null;
  /** ファイルを指定してプレビューを開始する（古い URL は自動で解放） */
  showPreview: (file?: File | null) => void;
  /** プレビューを終了して URL を解放する */
  clearPreview: () => void;
}

/**
 * File のプレビュー用 Blob URL を管理するフック。
 *
 * `URL.createObjectURL` / `URL.revokeObjectURL` の呼び出しをここに集約し、
 * モーダルごとの解放漏れ・二重生成を防ぐ。URL の生成・解放は
 * イベントハンドラとアンマウント時にのみ行う。
 */
export const useFilePreview = (): UseFilePreviewResult => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const clearPreview = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL?.(urlRef.current);
      urlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const showPreview = useCallback((file?: File | null) => {
    if (urlRef.current) {
      URL.revokeObjectURL?.(urlRef.current);
      urlRef.current = null;
    }

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    urlRef.current = url;
    setPreviewUrl(url);
  }, []);

  // アンマウント時に生成済みの URL を解放する
  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL?.(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  return { previewUrl, showPreview, clearPreview };
};

export default useFilePreview;
