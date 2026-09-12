import { useEffect, useRef, useCallback } from "react";
import { Song } from "@/types";
import { CHANNELS } from "@/electron/channels";
import { miniPlayer, isElectron } from "@/libs/electron";
import { isLocalFilePath } from "@/libs/songUtils";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";
import type { MiniPlayerTheme } from "@/types/local";

interface UseMiniPlayerSyncProps {
  song: Song | null;
  isPlaying: boolean;
}

/** ミニプレイヤーは別オリジンで動くため、テーマは状態に同梱して渡す */
function getTheme(): MiniPlayerTheme {
  const { theme300, theme400, theme500, theme600, theme900 } =
    useColorSchemeStore.getState().getColorScheme().colors;
  return { theme300, theme400, theme500, theme600, theme900 };
}

/**
 * メインプレイヤーの状態をミニプレイヤーに同期するフック
 */
export function useMiniPlayerSync({ song, isPlaying }: UseMiniPlayerSyncProps) {
  // 最新の状態を保持するためのref
  const songRef = useRef(song);
  const isPlayingRef = useRef(isPlaying);
  const colorSchemeId = useColorSchemeStore((s) => s.colorSchemeId);

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
            image_path: isLocalFilePath(currentSong.song_path)
              ? ""
              : currentSong.image_path,
          }
        : null,
      isPlaying: currentIsPlaying,
      theme: getTheme(),
    });
  }, []);

  // 再生状態をメインプロセスに送信（タスクバーサムネイルツールバー用）
  useEffect(() => {
    if (!isElectron()) return;

    window.electron.ipc.send(CHANNELS.PLAYER_STATE_CHANGE, { isPlaying });
  }, [isPlaying]);

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

  // song / isPlaying / テーマが変更されたときにミニプレイヤーに同期
  useEffect(() => {
    if (!isElectron()) return;

    // ミニプレイヤーに状態を同期（メインプロセス側でウィンドウがなければ無視される）
    sendState();
  }, [song, isPlaying, colorSchemeId, sendState]);
}
