import { useEffect, useRef, useCallback } from "react";
import { Song } from "@/types";
import { miniPlayer, isElectron } from "@/libs/electron";

interface UseMiniPlayerSyncProps {
  song: Song | null;
  isPlaying: boolean;
}

/**
 * メインプレイヤーの状態をミニプレイヤーに同期するフック
 */
export function useMiniPlayerSync({ song, isPlaying }: UseMiniPlayerSyncProps) {
  // 最新の状態を保持するためのref
  const songRef = useRef(song);
  const isPlayingRef = useRef(isPlaying);

  // refを更新
  useEffect(() => {
    songRef.current = song;
    isPlayingRef.current = isPlaying;
  }, [song, isPlaying]);

  // 状態を送信する関数
  const sendState = useCallback(async () => {
    if (!isElectron()) return;

    const currentSong = songRef.current;
    const currentIsPlaying = isPlayingRef.current;

    await miniPlayer.updateState({
      song: currentSong
        ? {
            id: currentSong.id,
            title: currentSong.title,
            author: currentSong.author,
            image_path: currentSong.image_path,
          }
        : null,
      isPlaying: currentIsPlaying,
    });
  }, []);

  // 状態再送信リクエストのリスナーを登録
  useEffect(() => {
    if (!isElectron()) return;

    const unsubscribe = miniPlayer.onRequestState(() => {
      sendState();
    });

    return () => {
      unsubscribe();
    };
  }, [sendState]);

  // song または isPlaying が変更されたときにミニプレイヤーに同期
  useEffect(() => {
    if (!isElectron()) return;

    // ミニプレイヤーに状態を同期（メインプロセス側でウィンドウがなければ無視される）
    sendState();
  }, [song, isPlaying, sendState]);
}
