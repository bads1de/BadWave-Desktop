"use client";

import Header from "@/components/Header/Header";
import SearchInput from "@/components/common/SearchInput";
import HeaderNav from "@/components/Header/HeaderNav";
import { useSearchParams, useRouter } from "next/navigation";
import useOnPlay from "@/hooks/player/useOnPlay";
import { useUser } from "@/hooks/auth/useUser";
import { Playlist, Song } from "@/types";
import usePlayer from "@/hooks/player/usePlayer";
import SongOptionsPopover from "@/components/Song/SongOptionsPopover";
import SongList from "@/components/Song/SongList";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCallback, memo, use } from "react";
import useGetSongsByTitle from "@/hooks/data/useGetSongsByTitle";
import useGetPlaylistsByTitle from "@/hooks/data/useGetPlaylistsByTitle";

// 曲リストセクションコンポーネント（メモ化）
const SongListSection = memo(
  ({
    songs,
    onPlay,
    isLoading,
  }: {
    songs: Song[];
    onPlay: (id: string) => void;
    isLoading: boolean;
  }) => {
    const { user } = useUser();

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-theme-500/20 rounded-none animate-ping" />
            <div className="absolute inset-2 border-2 border-theme-500/40 rounded-none animate-spin" />
            <div className="absolute inset-4 border-2 border-theme-500 rounded-none animate-pulse" />
          </div>
          <span className="text-theme-500 font-mono text-xs tracking-[0.3em] uppercase animate-pulse">
            // SEARCHING_NETWORKS...
          </span>
        </div>
      );
    }

    if (songs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-theme-500/40 font-mono">
          <h1 className="text-lg uppercase tracking-widest">[ NO_RESULTS_FOUND ]</h1>
          <p className="text-[10px] uppercase tracking-widest">ERROR_CODE: 404_NOT_FOUND</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-y-3 w-full p-6">
        {songs.map((song) => (
          <div key={song.id} className="flex items-center gap-x-4 w-full group/item">
            <div className="flex-1 min-w-0">
              <SongList data={song} onClick={(id: string) => onPlay(id)} />
            </div>
            {user?.id && (
              <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                <SongOptionsPopover song={song} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
);

// プレイリストセクションコンポーネント（メモ化）
const PlaylistSection = memo(
  ({ playlists, isLoading }: { playlists: Playlist[]; isLoading: boolean }) => {
    const router = useRouter();

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-theme-500/20 rounded-none animate-ping" />
            <div className="absolute inset-2 border-2 border-theme-500/40 rounded-none animate-spin" />
            <div className="absolute inset-4 border-2 border-theme-500 rounded-none animate-pulse" />
          </div>
          <span className="text-theme-500 font-mono text-xs tracking-[0.3em] uppercase animate-pulse">
            // SCANNING_DB...
          </span>
        </div>
      );
    }

    if (playlists.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-theme-500/40 font-mono">
          <h1 className="text-lg uppercase tracking-widest">[ PLAYLISTS_EMPTY ]</h1>
          <p className="text-[10px] uppercase tracking-widest">SYSTEM_INFO: NO_MATCHING_DATA</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
        {playlists.map((playlist, i) => (
          <motion.div
            key={playlist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="group relative cursor-pointer cyber-glitch"
            onClick={() =>
              router.push(
                `/playlists/${playlist.id}?title=${encodeURIComponent(
                  playlist.title
                )}`
              )
            }
          >
            <div className="relative bg-[#0a0a0f] border border-theme-500/20 group-hover:border-theme-500/60 p-4 transition-all duration-500 group-hover:-translate-y-2 rounded-none">
              <div className="relative aspect-square w-full overflow-hidden mb-4 border border-theme-500/10">
                <Image
                  src={playlist.image_path || "/images/playlist.png"}
                  alt={playlist.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                {/* 装飾用グリッド */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[length:20px_20px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
              </div>
              <div className="space-y-1 font-mono">
                <p className="text-[8px] text-theme-500/60 uppercase tracking-[0.3em]">
                  // PLN_TYPE: LIST
                </p>
                <h3 className="text-sm font-black text-white truncate uppercase tracking-widest group-hover:text-theme-300 transition-colors">
                  {playlist.title}
                </h3>
              </div>
              {/* HUDコーナー */}
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-theme-500/20 group-hover:border-theme-500 transition-colors" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-theme-500/20 group-hover:border-theme-500 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }
);

SongListSection.displayName = "SongListSection";
PlaylistSection.displayName = "PlaylistSection";

interface SearchProps {
  searchParams: Promise<{ title: string; tab?: string }>;
}

const Search = (props: SearchProps) => {
  const resolvedSearchParams = use(props.searchParams);
  const title = resolvedSearchParams.title || "";

  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "songs";

  const { songs, isLoading: songsLoading } = useGetSongsByTitle(title);
  const { playlists, isLoading: playlistsLoading } =
    useGetPlaylistsByTitle(title);

  const onPlay = useOnPlay(songs);
  const player = usePlayer();

  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
      player.setId(id);
    },
    [onPlay, player]
  );

  return (
    <div className="bg-[#0a0a0f] h-full w-full overflow-hidden overflow-y-auto pb-[80px] custom-scrollbar relative font-mono">
      {/* 背景装飾 */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />

      <div className="relative z-10">
        <Header className="sticky top-0 z-20">
          <div className="flex flex-col gap-y-4 px-6 py-2 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-4xl font-black tracking-[0.2em] text-white uppercase cyber-glitch">
                  SEARCH_DATABASE
                </h1>
                <div className="flex items-center gap-4 text-[8px] text-theme-500/60 uppercase tracking-[0.3em] font-mono mt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-theme-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(var(--theme-500),0.5)]" />
                    QUERY_STATUS: {songsLoading || playlistsLoading ? "PENDING..." : "RESOLVED"}
                  </span>
                  <span>// TARGET: DEEP_NET_RECORDS</span>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-8 border-l border-theme-500/10 pl-8 font-mono">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-theme-500/40 uppercase tracking-widest">Active_Node</span>
                  <span className="text-xs text-theme-300 font-bold tracking-widest uppercase">SEARCH_V7</span>
                </div>
              </div>
            </div>
            
            <SearchInput />
            <HeaderNav className="mt-2" />
          </div>
        </Header>

        <div className="w-full relative z-10 pt-4">
          {activeTab === "songs" && (
            <SongListSection
              songs={songs}
              onPlay={handlePlay}
              isLoading={songsLoading}
            />
          )}
          {activeTab === "playlists" && (
            <PlaylistSection playlists={playlists} isLoading={playlistsLoading} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
