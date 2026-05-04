"use client";

import Header from "@/components/header/Header";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { memo, useCallback } from "react";
import useGetPlaylists from "@/hooks/data/useGetPlaylists";
import { useSyncPlaylists } from "@/hooks/sync/useSyncPlaylists";
import { twMerge } from "tailwind-merge";



const PlaylistContent: React.FC = memo(() => {
  const router = useRouter();

  // バックグラウンド同期を開始
  useSyncPlaylists({ autoSync: true });

  // ローカルDBからデータを取得
  const { playlists, isLoading } = useGetPlaylists();

  const handlePlaylistClick = useCallback(
    (id: string) => {
      router.push(`/playlists/${id}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 font-mono">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-theme-500/20 rounded-none animate-ping" />
          <div className="absolute inset-2 border-2 border-theme-500/40 rounded-none animate-spin" />
          <div className="absolute inset-4 border-2 border-theme-500 rounded-none animate-pulse" />
        </div>
        <span className="text-theme-500 text-[10px] font-black tracking-[0.4em] uppercase animate-pulse">
          // INITIALIZING_SYNC_PROTOCOL...
        </span>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-theme-500/40 font-mono">
        <h1 className="text-xl uppercase tracking-[0.5em] mb-4 font-black">[ ZERO_STREAMS_DETECTED ]</h1>
        <p className="text-[9px] uppercase tracking-widest text-center max-w-xs leading-loose">
          // PLAYLIST_BUFFER_EMPTY. <br/>
          // PLEASE_EXECUTE_CREATE_COLLECTION_COMMAND_IN_SIDEBAR.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 p-8 font-mono">
      {playlists.map((playlist, i) => (
        <motion.div
          key={playlist.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className="group relative cursor-pointer"
          onClick={() => handlePlaylistClick(playlist.id)}
        >
          {/* Main Card Container */}
          <div className="relative bg-[#0a0a0f] border border-theme-500/20 p-4 transition-all duration-500 group-hover:border-theme-500/60 group-hover:bg-theme-500/5 overflow-hidden">
            {/* HUD Decoration */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-theme-500/0 group-hover:border-theme-500/40 transition-all duration-300" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-theme-500/0 group-hover:border-theme-500/40 transition-all duration-300" />
            
            {/* Top Info Bar */}
            <div className="flex items-center justify-between mb-3 text-[7px] text-theme-500/40 font-black tracking-widest uppercase">
              <span>VOL_0x{i.toString(16).padStart(4, '0')}</span>
              <span className="group-hover:text-theme-500 transition-colors">READY</span>
            </div>

            {/* Image Container */}
            <div className="relative aspect-square w-full overflow-hidden mb-4 border border-theme-500/10">
              <Image
                src={playlist.image_path || "/images/playlist.png"}
                alt={playlist.title}
                fill
                className="object-cover transition-all duration-700 grayscale-[40%] group-hover:scale-110 group-hover:grayscale-0"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
              />
              {/* Overlay Decor */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-2 right-2 w-6 h-[1px] bg-theme-500/40 group-hover:w-10 transition-all" />
            </div>

            {/* Title and Metadata */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-white truncate uppercase tracking-widest group-hover:text-theme-400 group-hover:translate-x-1 transition-all">
                {playlist.title}
              </h3>
              <div className="flex items-center gap-3">
                <div className="h-[1px] flex-grow bg-theme-500/10 group-hover:bg-theme-500/30" />
                <span className="text-[8px] text-theme-500 font-bold tracking-tight">
                  0x{playlist.id.slice(0, 4).toUpperCase()}
                </span>
                <div className="w-1 h-1 bg-theme-500 animate-pulse" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
});
PlaylistContent.displayName = "PlaylistContent";

// --- Page Component ---

const Playlist = () => {
  return (
    <div className="bg-[#0a0a0f] w-full h-full overflow-hidden overflow-y-auto custom-scrollbar relative font-mono">
      {/* 背景装飾 */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
      <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-0 bg-[length:100%_4px] bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)]" />

      <div className="relative z-10">
        <Header>
          <div className="flex items-center justify-between w-full px-4 lg:px-8 py-5 bg-[#0a0a0f]/60 backdrop-blur-xl border-b border-theme-500/10 relative overflow-hidden group">
            <div className="flex flex-col relative z-20">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-6 h-[2px] bg-theme-500" />
                <span className="text-[9px] text-theme-500 font-black tracking-[0.4em] uppercase">SYSTEM_ARCHIVE_CATALOG</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-[-0.02em] text-white uppercase cyber-glitch">
                COLLECTIONS
              </h1>
              <div className="flex items-center gap-6 text-[8px] text-theme-500/40 uppercase tracking-[0.3em] font-mono mt-3">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-theme-500 animate-pulse" />
                  USER_DATA_VAULT
                </span>
                <span>// ACCESS_LOG: 0xROOT</span>
                <span className="hidden sm:inline">// SECTOR: 0x77_B</span>
              </div>
            </div>
            
            <div className="hidden lg:flex flex-col items-end gap-2 relative z-20">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1.5 h-6 bg-theme-500/10 group-hover:bg-theme-500/20 transition-colors" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <div className="text-[8px] text-theme-500/60 font-black uppercase tracking-[0.2em]">
                Scanning_Archive_Nodes...
              </div>
            </div>
          </div>
        </Header>
        <div className="max-w-[1600px] mx-auto">
          <PlaylistContent />
        </div>
      </div>
    </div>
  );
};

export default Playlist;

