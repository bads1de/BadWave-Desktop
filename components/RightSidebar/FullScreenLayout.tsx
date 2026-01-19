import React from "react";
import { Song } from "@/types";
import NextSongPreview from "./NextSongPreview";
import CurrentSongDisplay from "./CurrentSongDisplay";
import useLyricsStore from "@/hooks/stores/useLyricsStore";
import SyncedLyrics from "@/components/Lyrics/SyncedLyrics";

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
      <div className="relative w-full h-full overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/5 bg-neutral-900 group">
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
