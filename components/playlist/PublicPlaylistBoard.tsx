"use client";

import { Playlist } from "@/types";
import ScrollableContainer from "@/components/common/ScrollableContainer";
import PlaylistCard from "@/components/playlist/PlaylistCard";
import { useState } from "react";
import { ROUTES, DURATIONS } from "@/constants";

interface PublicPlaylistBoardProps {
  playlists: Playlist[];
}

const PublicPlaylistBoard: React.FC<PublicPlaylistBoardProps> = ({
  playlists,
}) => {
  const [showArrows, setShowArrows] = useState(false);

  return (
    <section className="mb-4">
      {/* プレイリストスクロールエリア */}
      <div
        onMouseEnter={() => setShowArrows(true)}
        onMouseLeave={() => setShowArrows(false)}
      >
        <ScrollableContainer showArrows={showArrows}>
          {playlists.map((playlist, i) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              href={`${ROUTES.PLAYLISTS_DETAIL(playlist.id)}?title=${encodeURIComponent(
                playlist.title
              )}`}
              index={i}
              duration={DURATIONS.FAST}
              delayStep={0.1}
              animation="scale"
              className="min-w-[200px] max-w-[200px]"
              cardClassName="p-0 overflow-hidden bg-[#0a0a0f]/60 backdrop-blur-md rounded-xl group-hover:shadow-[0_0_20px_rgba(var(--theme-500),0.3)] cyber-glitch"
              artworkClassName="mb-0 border-0"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 200px"
              imageClassName="transition-all duration-700 group-hover:scale-110 group-hover:opacity-60"
              imageOverlay={
                <>
                  {/* HUDコーナー */}
                  <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-theme-500/40 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-theme-500/40 opacity-0 group-hover:opacity-100 transition-opacity z-20" />

                  {/* オーバーレイグラデーション */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/20 to-[#0a0a0f]/90 transition-all duration-500" />
                </>
              }
            >
              {/* プレイリスト情報 */}
              <div className="absolute bottom-0 w-full p-4 font-mono uppercase">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-theme-100 truncate group-hover:text-white transition-colors">
                    {playlist.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-theme-500/60 truncate tracking-widest">
                      {`// AUTH: ${playlist.user_name || "SYSTEM"}`}
                    </p>
                    <div className="w-1.5 h-1.5 bg-theme-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(var(--theme-500),0.8)] opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              </div>
            </PlaylistCard>
          ))}
        </ScrollableContainer>
      </div>
    </section>
  );
};

export default PublicPlaylistBoard;
