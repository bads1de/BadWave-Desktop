"use client";

import { useState, memo, useCallback } from "react";
import { Song } from "@/types";
import { motion } from "framer-motion";
import useOnPlay from "@/hooks/player/useOnPlay";
import ScrollableContainer from "@/components/common/ScrollableContainer";
import SongItem from "@/components/Song/SongItem";

interface ForYouBoardProps {
  className?: string;
  recommendations: Song[];
}

const ForYouBoard: React.FC<ForYouBoardProps> = ({
  className = "",
  recommendations = [],
}) => {
  const [showArrows, setShowArrows] = useState(false);
  const onPlay = useOnPlay(recommendations);

  // クリックハンドラをメモ化
  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
    },
    [onPlay]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (recommendations.length === 0) {
    return (
      <div className="py-10 border border-dashed border-theme-500/20 bg-theme-500/5 text-center px-4 font-mono rounded-xl">
        <p className="text-theme-500/60 uppercase tracking-[0.2em] text-xs">
          [ ! ] ALGORITHM_TRAINING_IN_PROGRESS
        </p>
        <p className="text-[10px] text-theme-500/40 mt-2 uppercase tracking-widest">
          // NEED_MORE_STREAM_DATA_FOR_PERSONALIZATION
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${className} relative`}
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
          {recommendations.map((song) => (
            <motion.div
              key={song.id}
              variants={itemVariants}
              className="group relative min-w-[200px] w-[200px]"
            >
              <SongItem onClick={handlePlay} data={song} />
            </motion.div>
          ))}
        </motion.div>
      </ScrollableContainer>
    </div>
  );
};

// 表示名を設定
ForYouBoard.displayName = "ForYouBoard";

// メモ化されたコンポーネントをエクスポート
export default memo(ForYouBoard);
