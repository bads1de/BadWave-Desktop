"use client";

import useOnPlay from "@/hooks/player/useOnPlay";
import { useUser } from "@/hooks/auth/useUser";
import { Song } from "@/types";
import React, { memo, useCallback } from "react";
import SongList from "@/components/song/SongList";
import SongOptionsPopover from "@/components/song/SongOptionsPopover";
import useGetSongsByGenre from "@/hooks/data/useGetSongsByGenre";

interface Props {
  genre: string;
}

const GenreContent: React.FC<Props> = memo(({ genre }) => {
  // 繧ｯ繝ｩ繧､繧｢繝ｳ繝医し繧､繝峨〒繝・・繧ｿ繧貞叙蠕暦ｼ医が繝輔Λ繧､繝ｳ蟇ｾ蠢應ｻ倥″・・
  const { songs, isLoading } = useGetSongsByGenre(genre);
  const onPlay = useOnPlay(songs);
  const { user } = useUser();

  // 蜀咲函繝上Φ繝峨Λ繧偵Γ繝｢蛹・
  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
    },
    [onPlay]
  );

  // 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ荳ｭ
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-500"></div>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="flex flex-col gap-y-2 w-full px-6 text-neutral-400">
        <h1>隧ｲ蠖薙・譖ｲ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-2 w-full p-6">
      {songs.map((song: Song) => (
        <div key={song.id} className="flex items-center gap-x-4 w-full">
          <div className="flex-1 min-w-0">
            <SongList data={song} onClick={handlePlay} />
          </div>
          {user?.id && (
            <div className="flex items-center gap-x-2">
              <SongOptionsPopover song={song} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

// displayName 繧定ｨｭ螳・
GenreContent.displayName = "GenreContent";

export default GenreContent;

