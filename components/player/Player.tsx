"use client";

import { usePathname } from "next/navigation";
import useGetSongById from "@/hooks/data/useGetSongById";
import usePlayer from "@/hooks/player/usePlayer";
import useGetPlaylists from "@/hooks/data/useGetPlaylists";
import React, { memo, useMemo } from "react";
import PlayerContent from "./PlayerContent";
import LyricsModal from "../modals/LyricsModal/LyricsModal";
import { isLocalSongId } from "@/libs/songUtils";

const Player = () => {
  const pathname = usePathname();
  const isPulsePage = pathname === "/pulse";
  const activeId = usePlayer((s) => s.activeId);
  // Map そのものを購読しないと setLocalSongs が反映されない
  const localSongs = usePlayer((s) => s.localSongs);
  const { playlists } = useGetPlaylists();

  // 1. ローカルストア（Zustand）から曲を取得
  const localSong = useMemo(() => {
    if (!activeId) return null;
    return localSongs.get(activeId) ?? null;
  }, [activeId, localSongs]);

  // 2. ローカルストアになく、かつIDが local_ で始まらない場合のみ Supabase から取得
  const isActuallyLocalId = useMemo(() => {
    return isLocalSongId(activeId);
  }, [activeId]);

  const { song: onlineSong } = useGetSongById(
    localSong || isActuallyLocalId ? undefined : activeId,
  );

  // 最適な楽曲を決定
  const finalSong = localSong || onlineSong;

  // pulseページではメインプレイヤーを非表示
  if (isPulsePage) {
    return null;
  }

  if (!finalSong || !finalSong.song_path) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full z-50">
        <div className="bg-[#0a0a0f] border-t-2 border-theme-500/40 w-full h-[100px] shadow-[0_-10px_30px_rgba(0,0,0,0.8),0_-5px_15px_rgba(var(--theme-500),0.1)] relative">
          {/* HUD装飾ライン */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-theme-500/40 to-transparent" />

          <PlayerContent song={finalSong} playlists={playlists} />
        </div>
      </div>

      {/* 全画面歌詞モーダル */}
      <LyricsModal song={finalSong} />
    </>
  );
};

export default memo(Player);
