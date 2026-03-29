"use client";

import { useState, useCallback, memo, ReactNode } from "react";
import SongItem from "@/components/song/SongItem";
import { Song } from "@/types";
import ScrollableContainer from "@/components/common/ScrollableContainer";
import { motion } from "framer-motion";

interface SongScrollBoardProps {
  songs: Song[];
  onPlaySong: (id: string) => void;
  className?: string;
  emptyState?: ReactNode;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const DEFAULT_EMPTY_STATE = (
  <div className="py-10 border border-dashed border-theme-500/20 bg-theme-500/5 text-center rounded-xl">
    <p className="text-theme-500/60 uppercase tracking-[0.4em] text-xs animate-pulse">
      [ ! ] NO_DATA_STREAMS_IN_BUFFER
    </p>
  </div>
);

/**
 * 曲を横スクロール可能なカードリストで表示する共通コンポーネント
 *
 * LatestBoard / ForYouBoard などの重複ロジックを統合。
 * 再生ハンドリングは呼び出し元に委譲する。
 */
const SongScrollBoard: React.FC<SongScrollBoardProps> = ({
  songs,
  onPlaySong,
  className,
  emptyState = DEFAULT_EMPTY_STATE,
}) => {
  const [showArrows, setShowArrows] = useState(false);

  const handlePlay = useCallback(
    (id: string) => {
      onPlaySong(id);
    },
    [onPlaySong],
  );

  if (songs.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={`${className ?? ""} relative`}
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      <ScrollableContainer showArrows={showArrows}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex space-x-4"
        >
          {songs.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="group relative min-w-[200px] w-[200px]"
            >
              <SongItem onClick={handlePlay} data={item} />
            </motion.div>
          ))}
        </motion.div>
      </ScrollableContainer>
    </div>
  );
};

export default memo(SongScrollBoard);
