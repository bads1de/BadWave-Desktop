"use client";

import { Song } from "@/types";
import SongList from "@/components/song/SongList";
import SongOptionsPopover from "@/components/song/SongOptionsPopover";
import { useUser } from "@/hooks/auth/useUser";
import { CSSProperties, memo, useCallback } from "react";
import { twMerge } from "tailwind-merge";

interface SongListRowProps {
  song: Song;
  onPlay: (id: string) => void;
  playlistId?: string;
  playlistUserId?: string;
  /** 未ログイン時はオプション（三点リーダー）を隠す */
  hideOptionsWhenSignedOut?: boolean;
  /** オプションをホバー時のみ表示する */
  optionsOnHover?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * 曲1件分の行表示
 *
 * SongListContent / ジャンルページ / 検索ページで重複していた
 * 「SongList + SongOptionsPopover」の行レイアウトをまとめる。
 */
const SongListRow: React.FC<SongListRowProps> = memo(
  ({
    song,
    onPlay,
    playlistId,
    playlistUserId,
    hideOptionsWhenSignedOut = false,
    optionsOnHover = false,
    className,
    style,
  }) => {
    const { user } = useUser();

    const handlePlay = useCallback(() => {
      onPlay(song.id);
    }, [onPlay, song.id]);

    const showOptions = !hideOptionsWhenSignedOut || !!user?.id;

    return (
      <div
        className={twMerge(
          "flex items-center gap-x-4 w-full",
          optionsOnHover && "group/item",
          className
        )}
        style={style}
      >
        <div className="flex-1 min-w-0">
          <SongList data={song} onClick={handlePlay} />
        </div>
        {showOptions && (
          <div
            className={
              optionsOnHover
                ? "opacity-0 group-hover/item:opacity-100 transition-opacity"
                : undefined
            }
          >
            <SongOptionsPopover
              song={song}
              playlistId={playlistId}
              playlistUserId={playlistUserId}
            />
          </div>
        )}
      </div>
    );
  }
);

// displayName を設定
SongListRow.displayName = "SongListRow";

export default SongListRow;
