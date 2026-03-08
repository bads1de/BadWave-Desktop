"use client";

import React, { memo, use } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Globe, Lock, Clock, Database, User } from "lucide-react";
import { notFound } from "next/navigation";

import PlaylistOptionsPopover from "@/components/Playlist/PlaylistOptionsPopover";
import { useUser } from "@/hooks/auth/useUser";
import SongListContent from "@/components/Song/SongListContent";
import useGetPlaylist from "@/hooks/data/useGetPlaylist";
import useGetPlaylistSongs from "@/hooks/data/useGetPlaylistSongs";
import { useSyncPlaylistSongs } from "@/hooks/sync/useSyncPlaylistSongs";

// --- Sub-components ---

interface PlaylistHeaderProps {
  playlistId: string;
  playlistTitle: string;
  imageUrl: string;
  songCount: number;
  isPublic: boolean;
  createdAt: string;
  userId: string;
}

const PlaylistHeader: React.FC<PlaylistHeaderProps> = memo(
  ({
    playlistId,
    playlistTitle,
    imageUrl,
    songCount,
    isPublic,
    createdAt,
    userId,
  }) => {
    const { user } = useUser();
    const formattedDate = format(new Date(createdAt), "yyyy.MM.dd", {
      locale: ja,
    });

    return (
      <div className="relative w-full overflow-hidden border-b border-theme-500/20 font-mono bg-[#0a0a0f]">
        {/* 背景装飾 */}
        <div className="absolute inset-0 opacity-10 grayscale blur-2xl scale-125 pointer-events-none">
          <Image
            src={imageUrl || "/images/playlist.png"}
            alt="Background"
            fill
            className="object-cover"
          />
        </div>
        
        {/* グリッドデコレーション */}
        <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none bg-[length:30px_30px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
        
        {/* 走査線 */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 bg-[length:100%_4px] bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-12 lg:pt-32 lg:pb-20">
          <div className="flex flex-col lg:flex-row items-center lg:items-end gap-10">
            {/* Cover Art Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-64 h-64 lg:w-80 lg:h-80 group flex-shrink-0"
            >
              <div className="absolute -inset-2 border border-theme-500/20 group-hover:border-theme-500/40 transition-colors" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t font-black text-theme-500 border-r border-theme-500" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b border-l border-theme-500" />
              
              <div className="relative w-full h-full overflow-hidden border border-theme-500/10">
                <Image
                  src={imageUrl || "/images/playlist.png"}
                  alt={playlistTitle}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-110"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              </div>

              {/* Technical Indicator */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                <div className="w-1 h-3 bg-theme-500/60" />
                <div className="w-1 h-1 bg-theme-500/40" />
              </div>
            </motion.div>

            {/* Info Section */}
            <div className="flex-grow flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className="px-2 py-0.5 border border-theme-500/40 bg-theme-500/5">
                    <span className="text-[9px] font-black text-theme-500 uppercase tracking-widest">ARCHIVE_RECORD</span>
                  </div>
                  <span className="text-[10px] text-theme-500/40 font-bold uppercase tracking-widest">ID: 0x{playlistId.slice(0, 8).toUpperCase()}</span>
                </div>
                
                <h1 className="text-4xl lg:text-7xl font-black text-white uppercase tracking-tight drop-shadow-[0_0_20px_rgba(var(--theme-500),0.3)] cyber-glitch">
                  {playlistTitle}
                </h1>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-2xl lg:max-w-none pt-8 border-t border-theme-500/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[8px] text-theme-500/40 uppercase tracking-widest">
                    <User size={10} />
                    AUTHORIZED_ENTITY
                  </div>
                  <div className="text-xs text-white uppercase font-black tracking-widest truncate max-w-[120px]">
                    {userId.slice(0, 8)}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[8px] text-theme-500/40 uppercase tracking-widest">
                    <Clock size={10} />
                    ARCHIVE_TIMESTAMP
                  </div>
                  <div className="text-xs text-white uppercase font-black tracking-widest">
                    {formattedDate}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[8px] text-theme-500/40 uppercase tracking-widest">
                    <Database size={10} />
                    BIT_DENSITY
                  </div>
                  <div className="text-xs text-theme-300 uppercase font-black tracking-widest">
                    {songCount.toString().padStart(2, '0')} TRACKS
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[8px] text-theme-500/40 uppercase tracking-widest">
                    {isPublic ? <Globe size={10} /> : <Lock size={10} />}
                    VISIBILITY_PROTOCOL
                  </div>
                  <div className={`text-xs font-black tracking-widest uppercase ${isPublic ? 'text-cyan-400' : 'text-red-500'}`}>
                    {isPublic ? 'PUBLIC_NET' : 'HIDDEN_SECTOR'}
                  </div>
                </div>
              </div>

              {/* Action Buttons Overlay */}
              {user?.id === userId && (
                <div className="pt-4 self-center lg:self-start">
                  <PlaylistOptionsPopover
                    playlistId={playlistId}
                    currentTitle={playlistTitle}
                    isPublic={isPublic}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
PlaylistHeader.displayName = "PlaylistHeader";

// --- Page Component ---

const PlaylistPage = (props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = use(props.params);
  const playlistId = params.id;

  const { playlist, isLoading: playlistLoading } = useGetPlaylist(playlistId);

  // バックグラウンド同期を開始
  useSyncPlaylistSongs(playlistId, { autoSync: true });

  // ローカルDBからデータを取得
  const { songs, isLoading: songsLoading } = useGetPlaylistSongs(playlistId);

  if (playlistLoading || songsLoading) {
    return (
      <div className="bg-[#0a0a0f] h-full w-full overflow-hidden flex flex-col items-center justify-center font-mono">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border border-theme-500/10 animate-ping" />
          <div className="absolute inset-2 border-2 border-theme-500/30 animate-spin" />
          <div className="absolute inset-4 border-4 border-theme-500 animate-pulse" />
        </div>
        <p className="mt-8 text-theme-500/60 text-[10px] font-black tracking-[0.4em] uppercase animate-pulse">
          // RECOVERING_ARCHIVE_DATA...
        </p>
      </div>
    );
  }

  if (!playlist) {
    return notFound();
  }

  return (
    <div className="bg-[#0a0a0f] h-full w-full overflow-hidden overflow-y-auto custom-scrollbar relative font-mono">
      <PlaylistHeader
        playlistId={playlist.id}
        playlistTitle={playlist.title}
        imageUrl={playlist.image_path || "/images/playlist.png"}
        songCount={songs.length}
        isPublic={playlist.is_public}
        createdAt={playlist.created_at}
        userId={playlist.user_id}
      />
      <div className="max-w-7xl mx-auto py-10 px-6">
        {songs.length ? (
          <SongListContent
            songs={songs}
            playlistId={playlist.id}
            playlistUserId={playlist.user_id}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-40 border border-dashed border-theme-500/10">
            <h2 className="text-xl font-black text-theme-500/40 uppercase tracking-[0.4em] mb-3">[ NULL_CONTENT ]</h2>
            <p className="text-[9px] font-bold text-theme-500/20 uppercase tracking-widest">
              // NO_SIGNAL_DETECTED_IN_THIS_COLLECTION.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistPage;
