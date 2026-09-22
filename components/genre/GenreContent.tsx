"use client";

import useOnPlay from "@/hooks/player/useOnPlay";
import { Song } from "@/types";
import React, { memo, useCallback } from "react";
import SongListRow from "@/components/song/SongListRow";
import useGetSongsByGenre from "@/hooks/data/useGetSongsByGenre";

interface Props {
  genre: string;
}

const GenreContent: React.FC<Props> = memo(({ genre }) => {
  // クライアントサイドでデータを取得（オフライン対応付き）
  const { songs, isLoading } = useGetSongsByGenre(genre);
  const onPlay = useOnPlay(songs);

  // 再生ハンドラをメモ化
  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
    },
    [onPlay]
  );

  // ローディング中
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
        <h1>該当の曲が見つかりませんでした</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-2 w-full p-6">
      {songs.map((song: Song) => (
        <SongListRow
          key={song.id}
          song={song}
          onPlay={handlePlay}
          hideOptionsWhenSignedOut
        />
      ))}
    </div>
  );
});

// displayName を設定
GenreContent.displayName = "GenreContent";

export default GenreContent;

