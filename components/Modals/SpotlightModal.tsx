import React, { useEffect, useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import { X } from "lucide-react";
import useSpotlightModal from "@/hooks/modal/useSpotlightModal";
import useVolumeStore from "@/hooks/stores/useVolumeStore";

const SpotlightModal = () => {
  const { isOpen, onClose } = useSpotlightModal();
  const selectedItem = useSpotlightModal((state) => state.selectedItem);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const { volume } = useVolumeStore();
  const [isLoading, setIsLoading] = React.useState(true);

  // Sync background video with main video
  useEffect(() => {
    const mainVideo = videoRef.current;
    const bgVideo = bgVideoRef.current;

    if (!mainVideo || !bgVideo) return;

    const syncPlay = () => bgVideo.play().catch(() => {});
    const syncPause = () => bgVideo.pause();
    const syncTime = () => {
      if (Math.abs(bgVideo.currentTime - mainVideo.currentTime) > 0.2) {
        bgVideo.currentTime = mainVideo.currentTime;
      }
    };

    mainVideo.addEventListener("play", syncPlay);
    mainVideo.addEventListener("pause", syncPause);
    mainVideo.addEventListener("timeupdate", syncTime);
    mainVideo.addEventListener("seeking", syncTime);

    return () => {
      mainVideo.removeEventListener("play", syncPlay);
      mainVideo.removeEventListener("pause", syncPause);
      mainVideo.removeEventListener("timeupdate", syncTime);
      mainVideo.removeEventListener("seeking", syncTime);
    };
  }, [isOpen, selectedItem, isLoading]);

  useEffect(() => {
    setIsLoading(true);
    const playVideo = async () => {
      if (videoRef.current && isOpen) {
        try {
          // Apply volume settings from store
          if (volume !== null) {
            videoRef.current.volume = volume * 0.5;
          } else {
            videoRef.current.volume = 0.5;
          }
          await videoRef.current.play();
        } catch (error) {
          console.error("Video playback failed:", error);
        }
      }
    };

    if (isOpen) {
      playVideo();
    } else {
      videoRef.current?.pause();
      bgVideoRef.current?.pause();
    }
  }, [isOpen, selectedItem, volume]);

  if (!selectedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-md transition-all duration-300">
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 md:p-6 pb-24 md:pb-32">
            <div className="relative w-full max-w-6xl mx-auto flex flex-col md:flex-row bg-black h-[85vh] md:h-[80vh] rounded-xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5">
              {/* Close Button - Floats nicely */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-50 p-2.5 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full transition-all duration-200 group border border-white/10"
              >
                <X className="h-5 w-5 text-white/90 group-hover:text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Video Section */}
              <div className="w-full md:w-[60%] lg:w-[65%] bg-zinc-950 relative overflow-hidden flex items-center justify-center shrink-0">
                {selectedItem.video_path && (
                  <>
                    {/* Synchronized Background Blur Layer */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <video
                        ref={bgVideoRef}
                        src={selectedItem.video_path}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover blur-2xl opacity-60 scale-110 saturate-150"
                      />
                      {/* Dark overlay to ensure content pops */}
                      <div className="absolute inset-0 bg-black/30" />
                    </div>

                    {/* Main Video Layer */}
                    <video
                      ref={videoRef}
                      key={selectedItem.video_path}
                      src={selectedItem.video_path}
                      loop
                      playsInline
                      muted={false} // Managed by effect above
                      controls={false}
                      onClick={(e) => {
                        const v = e.currentTarget;
                        v.paused ? v.play() : v.pause();
                      }}
                      onLoadedData={() => setIsLoading(false)}
                      className={`relative max-w-full max-h-full w-full h-full object-contain shadow-2xl z-10 cursor-pointer transition-opacity duration-500 ${
                        isLoading ? "opacity-0" : "opacity-100"
                      }`}
                    />

                    {/* Loading Spinner */}
                    {isLoading && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Content Section - Instagram Style */}
              <div className="w-full md:flex-1 bg-zinc-950 border-t md:border-t-0 md:border-l border-white/10 flex flex-col h-full relative z-20">
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                      <span className="font-bold text-white text-lg">
                        {selectedItem.author.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight hover:underline cursor-pointer">
                        {selectedItem.author}
                      </h3>
                      <p className="text-xs text-neutral-400 font-medium tracking-wide uppercase">
                        {selectedItem.genre}
                      </p>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white leading-snug">
                      {selectedItem.title}
                    </h2>
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedItem.description || "No description available."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default SpotlightModal;
