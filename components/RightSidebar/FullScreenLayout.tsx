import React from "react";
import { Song } from "@/types";
import NextSongPreview from "./NextSongPreview";
import CurrentSongDisplay from "./CurrentSongDisplay";
import useLyricsStore from "@/hooks/stores/useLyricsStore";
import SyncedLyrics from "@/components/lyrics/SyncedLyrics";

interface FullScreenLayoutProps {
  song: Song;
  videoPath?: string;
  imagePath?: string;
  nextSong: Song | undefined;
  nextImagePath?: string;
}

const FullScreenLayout: React.FC<FullScreenLayoutProps> = React.memo(
  ({ song, videoPath, imagePath, nextSong, nextImagePath }) => {
    const { showLyrics } = useLyricsStore();
    const lyrics = song.lyrics ?? "";

    if (showLyrics) {
      return <SyncedLyrics lyrics={lyrics} />;
    }

    return (
      <div className="relative w-full h-full overflow-hidden rounded-none shadow-2xl border border-theme-500/20 bg-[#0a0a0f] group">
        {/* HUD繧ｳ繝ｼ繝翫・ */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-theme-500/40 z-20 group-hover:border-theme-500 transition-colors pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-theme-500/40 z-20 group-hover:border-theme-500 transition-colors pointer-events-none" />

        <CurrentSongDisplay
          song={song}
          videoPath={videoPath}
          imagePath={imagePath}
        />
        <NextSongPreview nextSong={nextSong} nextImagePath={nextImagePath} />
      </div>
    );
  },
);

FullScreenLayout.displayName = "FullScreenLayout";

export default FullScreenLayout;

