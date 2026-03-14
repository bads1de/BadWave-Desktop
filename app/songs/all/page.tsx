"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import useGetAllSongsPaginated from "@/hooks/data/useGetAllSongsPaginated";
import { useSyncAllSongs } from "@/hooks/sync/useSyncAllSongs";
import useOnPlay from "@/hooks/player/useOnPlay";
import usePlayer from "@/hooks/player/usePlayer";

import SongItem from "@/components/song/SongItem";
import SongItemSkeleton from "@/components/song/SongItemSkeleton";
import Pagination from "@/components/common/Pagination";

const PAGE_SIZE = 24;

/**
 * 蜈ｨ譖ｲ荳隕ｧ繝壹・繧ｸ
 *
 * Latest Releases 縺ｮ縲悟・縺ｦ繧定｡ｨ遉ｺ縲阪°繧蛾・遘ｻ縺吶ｋ隧ｳ邏ｰ繝壹・繧ｸ
 * 繝壹・繧ｸ繝阪・繧ｷ繝ｧ繝ｳ蟇ｾ蠢懊〒蜈ｨ譖ｲ繧帝夢隕ｧ蜿ｯ閭ｽ
 */
export default function AllSongsPage() {
  const [page, setPage] = useState(0);

  // 繝・・繧ｿ蜿門ｾ暦ｼ医Ο繝ｼ繧ｫ繝ｫDB縺九ｉ・・
  const { songs, totalPages, isLoading } = useGetAllSongsPaginated(
    page,
    PAGE_SIZE
  );

  // 繝舌ャ繧ｯ繧ｰ繝ｩ繧ｦ繝ｳ繝牙酔譛・
  useSyncAllSongs();

  // 蜀咲函讖溯・
  const player = usePlayer();
  const onPlay = useOnPlay(songs);

  const handlePlay = (id: string) => {
    onPlay(id);
    player.setId(id);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // 繝壹・繧ｸ螟画峩譎ゅ↓繝医ャ繝励↓繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex bg-[#0a0a0f] h-full overflow-hidden font-mono relative">
      {/* 閭梧勹陬・｣ｾ */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0 bg-[length:100px_100px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.5)_1px,transparent_1px)]" />

      <div className="w-full h-full overflow-y-auto custom-scrollbar relative z-10">
        <main className="px-8 py-12 pb-32 max-w-[1600px] mx-auto">
          {/* 繝倥ャ繝繝ｼ (HUD Style) */}
          <div className="mb-12 border-l-4 border-theme-500 pl-6 relative">
            <div className="absolute -top-4 -left-1 text-[8px] text-theme-500/40 uppercase tracking-[0.5em]">
               archive_access: authorized
            </div>
            
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-theme-500/60 hover:text-white transition-all duration-300 mb-6 uppercase text-[10px] font-black tracking-widest group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>[ BACK_TO_CENTRAL_HUB ]</span>
            </Link>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(var(--theme-500),0.8)] cyber-glitch">
              LATEST_SIGNAL_RELEASE
            </h1>
            <p className="text-theme-500/60 mt-2 text-xs uppercase tracking-widest italic">
              // DECRYPTING_ALL_RECENT_BINARY_STREAMS_IN_THIS_SECTOR
            </p>
            
            {/* 陬・｣ｾ逕ｨHUD繝代・繝・*/}
            <div className="absolute top-0 right-0 w-24 h-px bg-gradient-to-l from-theme-500/40 to-transparent" />
          </div>

          {/* 譖ｲ荳隕ｧ */}
          {isLoading && songs.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SongItemSkeleton key={i} />
              ))}
            </div>
          ) : songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-theme-500/20 bg-theme-500/5 rounded-xl">
              <p className="text-theme-500/60 uppercase tracking-[0.4em] text-sm animate-pulse">
                [ ! ] NO_DATA_STREAMS_DETECTED_IN_ARCHIVE
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
            >
              {songs.map((song) => (
                <motion.div
                  key={song.id}
                  variants={itemVariants}
                  className="group relative"
                >
                  <SongItem onClick={handlePlay} data={song} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* 繝壹・繧ｸ繝阪・繧ｷ繝ｧ繝ｳ (HUD Style) */}
          {totalPages > 1 && (
            <div className="mt-20 pt-10 border-t border-theme-500/10">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-[8px] text-theme-500/20 uppercase tracking-widest font-bold">
                    sector_index: {page + 1} // total_blocks: {totalPages}
                 </span>
                 <div className="h-px flex-1 mx-8 bg-gradient-to-r from-theme-500/20 via-transparent to-transparent" />
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

