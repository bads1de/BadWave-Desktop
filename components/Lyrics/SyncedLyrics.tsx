"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { AudioEngine } from "@/libs/audio/AudioEngine";

interface SyncedLyricsProps {
  lyrics: string;
}

interface LyricLine {
  time: number;
  text: string;
}

// [00:00.00] 形式を秒に変換
const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(":");
  const min = parseFloat(parts[0]);
  const sec = parseFloat(parts[1]);
  return min * 60 + sec;
};

const SyncedLyrics = ({ lyrics }: SyncedLyricsProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const engine = AudioEngine.getInstance();
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // 1. LRCパース
  const lines = useMemo(() => {
    if (!lyrics) return [];

    // LRC形式かどうかを簡易チェック
    if (!lyrics.includes("[")) return [];

    const result: LyricLine[] = [];
    const rawLines = lyrics.split("\n");

    for (const line of rawLines) {
      // [00:00.00]Text
      const match = line.match(/^\[(\d{2}:\d{2}\.\d{2,3})\](.*)/);
      if (match) {
        result.push({
          time: parseTime(match[1]),
          text: match[2].trim(),
        });
      }
    }

    // パース結果が空、または行数が少なすぎる場合はプレーンテキスト扱いにする判定も検討
    return result;
  }, [lyrics]);

  // 2. 時刻同期
  useEffect(() => {
    const audio = engine.audio;
    if (!audio) return;

    // 初期化時に現在時刻を設定
    setCurrentTime(audio.currentTime);

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [engine]);

  // 3. アクティブ行の探索
  const activeIndex = useMemo(() => {
    // 現在時刻より前で、最も近い行を探す
    let index = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= currentTime) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [currentTime, lines]);

  // ユーザーのスクロール操作を検知
  const handleScroll = () => {
    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    // 2秒間スクロールがなければ自動スクロール再開
    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 2000);
  };

  // 4. 自動スクロール
  useEffect(() => {
    if (
      activeIndex !== -1 &&
      containerRef.current &&
      !isUserScrolling.current
    ) {
      const activeEl = containerRef.current.children[
        activeIndex
      ] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeIndex]);

  // 5. 行クリックでシーク
  const handleLineClick = (time: number) => {
    if (engine.audio) {
      engine.audio.currentTime = time;
    }
  };

  // LRCでない、またはパース失敗時はプレーンテキスト表示
  if (lines.length === 0) {
    return (
      <div className="relative w-full h-full bg-black/20 backdrop-blur-sm rounded-xl border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 pointer-events-none" />
        <div className="flex items-center justify-center h-full py-8 px-6">
          <div className="w-full max-h-full overflow-y-auto custom-scrollbar pr-2">
            <p
              className="whitespace-pre-wrap text-neutral-200 text-lg font-medium leading-relaxed tracking-wide text-center"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
            >
              {lyrics || "歌詞はありません"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 group">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto custom-scrollbar py-1/2 px-4 text-center scroll-smooth"
        style={{ paddingBlock: "50%" }} // 真ん中に表示されやすくするためのパディング
      >
        {lines.map((line, index) => {
          const isActive = index === activeIndex;
          // 歌詞が空の場合はスペースを入れて高さを維持
          const text = line.text === "" ? "\u00A0" : line.text;

          return (
            <div
              key={index}
              onClick={() => handleLineClick(line.time)}
              className={`
                            py-4 px-4 rounded-xl cursor-pointer transition-all duration-500 ease-out transform origin-center
                            ${
                              isActive
                                ? "text-white text-3xl font-bold scale-105 bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)] backdrop-blur-md border border-white/10"
                                : "text-neutral-500 text-xl font-medium hover:text-neutral-300 hover:bg-white/5 scale-100 blur-[0.5px] hover:blur-0"
                            }
                        `}
              style={{
                textShadow: isActive
                  ? "0 0 20px rgba(255,255,255,0.4)"
                  : "none",
              }}
            >
              {text}
            </div>
          );
        })}
      </div>
      {/* フェードエフェクト */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#121212] to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#121212] to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default SyncedLyrics;
