"use client";

import { usePathname } from "next/navigation";
import useGetSongById from "@/hooks/data/useGetSongById";
import usePlayer from "@/hooks/player/usePlayer";
import useGetPlaylists from "@/hooks/data/useGetPlaylists";
import React, { memo, useMemo } from "react";
import PlayerContent from "./PlayerContent";
import LyricsModal from "../Modals/LyricsModal/LyricsModal";

const Player = () => {
  const pathname = usePathname();
  const isPulsePage = pathname === "/pulse";
  const player = usePlayer();
  const { playlists } = useGetPlaylists();

  // 1. まずローカルストア（Zustand）から曲を取得（プレフィックス不問）
  const localSong = useMemo(() => {
    if (!player.activeId) return null;
    return player.getLocalSong(player.activeId);
  }, [player.activeId, player.getLocalSong]);

  // 2. ローカルストアになく、かつIDが local_ で始まらない場合のみ Supabase から取得
  const isActuallyLocalId = useMemo(() => {
    return (
      typeof player.activeId === "string" &&
      player.activeId.startsWith("local_")
    );
  }, [player.activeId]);

  const { song: onlineSong } = useGetSongById(
    localSong || isActuallyLocalId ? undefined : player.activeId,
  );

  // 最終的な曲を決定
  const finalSong = localSong || onlineSong;

  // pulseページではプレイヤーを非表示
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
