import React, { useState, useRef, memo } from "react";
import { Spotlight } from "@/types";
import useSpotlightModal from "@/hooks/modal/useSpotlightModal";
import ScrollableContainer from "./common/ScrollableContainer";
import useVolumeStore from "@/hooks/stores/useVolumeStore";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { WifiOff } from "lucide-react";

interface SpotlightBoardProps {
  spotlightData: Spotlight[];
}

// コンポーネント関数を定義
const SpotlightBoardComponent: React.FC<SpotlightBoardProps> = ({
  spotlightData,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showArrows, setShowArrows] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const spotlightModal = useSpotlightModal();
  const { volume } = useVolumeStore();
  const { isOnline } = useNetworkStatus();

  const handleVideoHover = (index: number) => {
    setHoveredIndex(index);
    if (videoRefs.current[index]) {
      videoRefs.current[index]
        .play()
        .catch((error) => console.log("Video play failed:", error));
    }
  };

  const handleVideoLeave = () => {
    setHoveredIndex(null);
    videoRefs.current.forEach((video) => {
      if (video) video.pause();
    });
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (!newMutedState) {
      // ミュートが解除された場合
      videoRefs.current.forEach((video) => {
        if (video) {
          video.volume = volume;
        }
      });
    }
  };

  return (
    <div
      className="w-full cursor-pointer relative"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      <ScrollableContainer showArrows={showArrows} className="p-4">
        <div className="flex gap-6">
          {spotlightData.map((item, index) => (
            <div
              key={item.id}
              className={`flex-none w-44 relative aspect-[9/16] rounded-none overflow-hidden shadow-lg border border-theme-500/20 hover:border-theme-400 hover:shadow-[0_0_20px_rgba(var(--theme-500),0.3)] transition-all duration-500 hover:scale-105 group cyber-glitch ${
                !isOnline ? "opacity-30 grayscale" : ""
              }`}
              onMouseEnter={() => isOnline && handleVideoHover(index)}
              onMouseLeave={handleVideoLeave}
              onClick={() => isOnline && spotlightModal.onOpen(item)}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-theme-900/60 z-10 pointer-events-none" />
              
              {/* HUDコーナー */}
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-theme-500/40 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-theme-500/40 opacity-0 group-hover:opacity-100 transition-opacity z-20" />

              {isOnline ? (
                <video
                  ref={(el) => {
                    if (el) {
                      videoRefs.current[index] = el;
                      el.volume = volume;
                    }
                  }}
                  src={item.video_path}
                  muted={isMuted}
                  playsInline
                  loop
                  className="w-full h-full object-cover transition-opacity duration-700 group-hover:opacity-90 grayscale-[0.5] group-hover:grayscale-0"
                />
              ) : (
                <div className="w-full h-full bg-theme-900/40 flex items-center justify-center">
                  <WifiOff className="w-10 h-10 text-theme-500/40" />
                </div>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMuteToggle();
                }}
                className="absolute bottom-3 right-3 p-2.5 rounded-none bg-theme-900/60 hover:bg-theme-500/40 backdrop-blur-md transition-all duration-300 z-20 border border-theme-500/30"
              >
                <svg
                  className="w-4 h-4 text-theme-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMuted ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM16 12l4 4m0-4l-4 4"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  )}
                </svg>
              </button>
            </div>
          ))}
        </div>
      </ScrollableContainer>
    </div>
  );
};

// displayName を設定
SpotlightBoardComponent.displayName = "SpotlightBoard";

// memo でラップしてエクスポート
const SpotlightBoard = memo(SpotlightBoardComponent);

export default SpotlightBoard;
