"use client";

import { Song } from "@/types";
import useOnPlay from "@/hooks/player/useOnPlay";
import SongOptionsPopover from "@/components/song/SongOptionsPopover";
import SongList from "@/components/song/SongList";
import BulkDownloadButton from "@/components/downloads/BulkDownloadButton";
import { memo, useCallback } from "react";
import useGetLikedSongs from "@/hooks/data/useGetLikedSongs";
import { useSyncLikedSongs } from "@/hooks/sync/useSyncLikedSongs";
import { useUser } from "@/hooks/auth/useUser";

interface SongListContentProps {
  songs?: Song[];
  playlistId?: string;
  playlistUserId?: string;
  showDownloadButton?: boolean;
}

const SongListContent: React.FC<SongListContentProps> = memo(
  ({
    songs: propSongs,
    playlistId,
    playlistUserId,
    showDownloadButton = true,
  }) => {
    const { user } = useUser();

    // 繝舌ャ繧ｯ繧ｰ繝ｩ繧ｦ繝ｳ繝牙酔譛溘ｒ髢句ｧ具ｼ・ropSongs縺後↑縺・ｴ蜷茨ｼ昴♀豌励↓蜈･繧翫・繝ｼ繧ｸ・・
    // autoSync: true 縺ｫ繧医ｊ縲√・繧ｦ繝ｳ繝域凾縺翫ｈ縺ｳ繧ｪ繝ｳ繝ｩ繧､繝ｳ蠕ｩ蟶ｰ譎ゅ↓閾ｪ蜍募酔譛・
    useSyncLikedSongs({ autoSync: !propSongs });

    // 繧ｯ繝ｩ繧､繧｢繝ｳ繝医し繧､繝峨〒繝・・繧ｿ繧貞叙蠕暦ｼ医Ο繝ｼ繧ｫ繝ｫDB縺九ｉ隱ｭ縺ｿ霎ｼ縺ｿ・・
    const { likedSongs, isLoading } = useGetLikedSongs(
      propSongs ? undefined : user?.id
    );

    const songs = propSongs ?? likedSongs;
    const onPlay = useOnPlay(songs);
    const displayedSongs = playlistId ? [...songs].reverse() : songs;

    // 蜀咲函繝上Φ繝峨Λ繧偵Γ繝｢蛹・
    const handlePlay = useCallback(
      (id: string) => {
        onPlay(id);
      },
      [onPlay]
    );

    // 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ荳ｭ・・rops縺ｧsongs縺梧ｸ｡縺輔ｌ縺溷ｴ蜷医・繧ｹ繧ｭ繝・・・・
    if (!propSongs && isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 font-mono">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-theme-500/10 rounded-none animate-ping" />
            <div className="absolute inset-2 border-2 border-theme-500/30 rounded-none animate-spin" />
            <div className="absolute inset-4 border-2 border-theme-500 rounded-none animate-pulse" />
          </div>
          <p className="text-theme-500 text-[10px] tracking-[0.3em] uppercase animate-pulse">
            // SYNCING_TRACK_METADATA...
          </p>
        </div>
      );
    }

    if (songs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-theme-500/40 font-mono">
          <div className="text-xl uppercase tracking-[0.4em]">[ VOID_DETECTED ]</div>
          <p className="text-[10px] uppercase tracking-widest text-center max-w-xs">
            // NO_AUDIO_STREAMS_FOUND_IN_THIS_SECTOR.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full px-4 sm:px-8 pb-32">
        {/* 繝・・繝ｫ繝舌・ / 繧｢繧ｯ繧ｷ繝ｧ繝ｳ繧ｨ繝ｪ繧｢ */}
        {showDownloadButton && (
          <div className="flex items-center justify-between py-6 px-4 sticky top-0 z-20 bg-[#0a0a0f]/60 backdrop-blur-xl border-y border-theme-500/10 -mx-4 mb-8 font-mono">
            <div className="flex flex-col gap-1">
              <span className="text-theme-300 text-xs font-black tracking-[0.2em] uppercase">
                {songs.length.toString().padStart(2, '0')}_TRACKS_FOUND
              </span>
              <div className="h-0.5 w-12 bg-theme-500 shadow-[0_0_8px_rgba(var(--theme-500),0.8)]" />
            </div>
            <BulkDownloadButton
              songs={songs}
              downloadLabel={
                playlistId ? "DOWNLOAD_ARCHIVE" : "DOWNLOAD_COLLECTION"
              }
              deleteLabel="CLEAR_LOCAL_CACHE"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-y-3">
          {displayedSongs.map((song: Song) => (
            <div
              key={song.id}
              className="flex items-center gap-x-4 w-full animate-fade-in"
              style={{
                animationDelay: `${displayedSongs.indexOf(song) * 50}ms`,
              }}
            >
              <div className="flex-1 min-w-0">
                <SongList data={song} onClick={handlePlay} />
              </div>
              <SongOptionsPopover
                song={song}
                playlistId={playlistId}
                playlistUserId={playlistUserId}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

SongListContent.displayName = "SongListContent";

export default SongListContent;

