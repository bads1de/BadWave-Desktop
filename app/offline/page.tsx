"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Song } from "@/types";
import { electronAPI } from "@/libs/electron";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import SongItem from "@/components/song/SongItem";
import Header from "@/components/header/Header";
import usePlayer from "@/hooks/player/usePlayer";

const OfflinePage = () => {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const player = usePlayer();
  const [offlineSongs, setOfflineSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // オフラインモードでオンラインになった場合、ホームに戻る
  useEffect(() => {
    if (isOnline) {
      router.push("/");
    }
  }, [isOnline, router]);

  // オフライン曲の取得命令
  useEffect(() => {
    const fetchOfflineSongs = async () => {
      setIsLoading(true);
      try {
        if (electronAPI.isElectron()) {
          const songs = await electronAPI.offline.getSongs();
          // OfflineSong[] を Song[] に変換してセット
          setOfflineSongs(songs as unknown as Song[]);
        }
      } catch (error) {
        console.error("Failed to fetch offline songs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfflineSongs();
  }, []);

  const handlePlay = (id: string) => {
    const song = offlineSongs.find((s) => s.id === id);
    if (!song) return;

    // プレイヤーに全オフライン曲をセット
    player.setIds(offlineSongs.map((s) => s.id));

    // オフライン曲をプレイヤーにセット
    offlineSongs.forEach((s) => {
      player.setLocalSong(s);
    });

    // 再生開始
    player.setId(id);
  };

  return (
    <div className="bg-[#0a0a0f] h-full w-full overflow-hidden overflow-y-auto relative font-mono custom-scrollbar">
      {/* 背景装飾 */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />

      <div className="relative z-10">
        <Header className="sticky top-0 z-20">
          <div className="flex items-center justify-between w-full px-4 lg:px-8 py-2">
            <div className="flex flex-col">
              <h1 className="text-4xl font-black tracking-[0.2em] text-theme-500 uppercase cyber-glitch">
                OFFLINE_PROTOCOL
              </h1>
              <div className="flex items-center gap-4 text-[8px] text-theme-500/60 uppercase tracking-[0.3em] font-mono mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                  NETWORK: LOST
                </span>
                <span>// SECTOR: CACHE_BLOCK_A</span>
                <span className="hidden sm:inline">
                  // DECRYPTION: LOCAL_ONLY
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 border-l border-theme-500/10 pl-8 font-mono">
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-theme-500/40 uppercase tracking-widest">
                  Protocol_Mode
                </span>
                <span className="text-xs text-red-400 font-bold tracking-widest">
                  EMERGENCY_ACCESS
                </span>
              </div>
            </div>
          </div>
        </Header>

        <div className="px-6 py-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-2 border-theme-500/10 animate-ping" />
                <div className="absolute inset-4 border-2 border-theme-500/30 animate-spin" />
                <div className="absolute inset-8 border-2 border-theme-500 animate-pulse" />
              </div>
              <span className="text-theme-500 text-[10px] tracking-[0.4em] uppercase animate-pulse">
                // SCANNING_LOCAL_BUFFERS...
              </span>
            </div>
          ) : offlineSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 border border-theme-500/10">
              <h2 className="text-xl uppercase tracking-[0.5em] font-black text-theme-500/40">
                [ CACHE_MISS ]
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-center mt-2 max-w-sm px-6 text-theme-500/20">
                // NO_DOWNLOADED_STREAMS_DETECTED.
                DOWNLOAD_FAVORITES_TO_ACCESS_DURING_OUTAGE.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-6">
              {offlineSongs.map((song) => (
                <SongItem key={song.id} data={song} onClick={handlePlay} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
