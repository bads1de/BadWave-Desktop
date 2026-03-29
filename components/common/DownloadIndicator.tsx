"use client";

import { Song } from "@/types";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { IoCloudDone } from "react-icons/io5";

interface DownloadIndicatorProps {
  song: Song;
  size?: number;
}

const DownloadIndicator: React.FC<DownloadIndicatorProps> = ({
  song,
  size = 12,
}) => {
  const { isDownloaded: hookIsDownloaded } = useDownloadSong(song);
  const isDownloaded = song.is_downloaded ?? hookIsDownloaded;

  if (!isDownloaded) return null;

  return (
    <div className="flex items-center text-theme-500 drop-shadow-[0_0_8px_rgba(var(--theme-500),0.6)]">
      <IoCloudDone size={size} />
    </div>
  );
};

export default DownloadIndicator;
