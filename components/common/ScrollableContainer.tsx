"use client";

import React, { useRef, memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollableContainerProps {
  children: React.ReactNode;
  showArrows?: boolean;
  className?: string;
}

const ScrollableContainer: React.FC<ScrollableContainerProps> = memo(
  ({ children, showArrows = false, className = "" }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // スクロール関数をメモ化
    const scroll = useCallback((direction: "left" | "right") => {
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.clientWidth;
        const scrollAmount =
          direction === "left" ? -containerWidth * 0.8 : containerWidth * 0.8;

        scrollRef.current.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    }, []);

    return (
      <div className="relative group/scroll">
        {showArrows && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-[#0a0a0f]/80 text-theme-500 p-3 border border-theme-500/30 z-10 hover:bg-theme-500/20 hover:text-white transition-all hidden md:flex items-center justify-center cyber-glitch shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          >
            <ChevronLeft
              size={24}
              className="drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)]"
            />
          </button>
        )}
        <div
          ref={scrollRef}
          className={`flex overflow-x-auto space-x-6 pb-6 scrollbar-hide smooth-scroll ${className}`}
        >
          {children}
        </div>
        {showArrows && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-[#0a0a0f]/80 text-theme-500 p-3 border border-theme-500/30 z-10 hover:bg-theme-500/20 hover:text-white transition-all hidden md:flex items-center justify-center cyber-glitch shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          >
            <ChevronRight
              size={24}
              className="drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)]"
            />
          </button>
        )}
        {/* 装飾用ライン */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-theme-500/10 to-transparent opacity-0 group-hover/scroll:opacity-100 transition-opacity" />
      </div>
    );
  },
);

// 表示名を設定
ScrollableContainer.displayName = "ScrollableContainer";

export default ScrollableContainer;
