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

    console.log("Sending state to mini-player:", {
      song: currentSong,
      isPlaying: currentIsPlaying,
    });

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

    console.log("Setting up mini-player state request listener");
    const unsubscribe = miniPlayer.onRequestState(() => {
      console.log("Received state request from mini-player");
      sendState();
    });

    return () => {
      unsubscribe();
    };
  }, [sendState]);

  // song または isPlaying が変更されたときにミニプレイヤーに同期
  useEffect(() => {
    if (!isElectron()) return;

    // ミニプレイヤーが開いているか確認して同期
    const checkAndSync = async () => {
      const isOpen = await miniPlayer.isOpen();
      if (isOpen) {
        sendState();
      }
    };

    checkAndSync();
  }, [song, isPlaying, sendState]);

  return { syncState: sendState };
}
