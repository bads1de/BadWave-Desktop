"use client";

import React, { useState, memo, useCallback } from "react";
import Image from "next/image";
import useGetTopPlayedSongs from "@/hooks/data/useGetTopPlayedSongs";
import useOnPlay from "@/hooks/player/useOnPlay";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";

interface TopPlayedSongsProps {
  user: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
}

const PERIODS = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
] as const;

const TopPlayedSongs: React.FC<TopPlayedSongsProps> = memo(({ user }) => {
  const [period, setPeriod] =
    useState<(typeof PERIODS)[number]["value"]>("day");
  const { topSongs, isLoading } = useGetTopPlayedSongs(user?.id, period);
  const onPlay = useOnPlay(topSongs || []);
  const { getColorScheme, hasHydrated } = useColorSchemeStore();
  const colorScheme = getColorScheme();

  // 再生ハンドラをメモ化
  const handlePlay = useCallback(
    (id: string) => {
      onPlay(id);
    },
    [onPlay]
  );

  return (
    <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/[0.02] shadow-inner rounded-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-white">
          再生ランキング
        </h3>
        <div className="w-full md:w-auto overflow-x-auto scrollbar-hide">
          <div className="inline-flex h-10 items-center justify-start md:justify-center rounded-xl bg-neutral-800/50 backdrop-blur-xl border border-white/[0.02] p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`
                  inline-flex items-center justify-center whitespace-nowrap rounded-xl
                  px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium
                  transition-all duration-300
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-offset-2
                  disabled:pointer-events-none disabled:opacity-50
                  min-w-[60px] md:min-w-[80px]
                  ${
                    period === p.value
                      ? "text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl"
                  }
                `}
                style={
                  period === p.value && hasHydrated
                    ? {
                        background: `linear-gradient(to bottom right, ${colorScheme.colors.accentFrom}33, ${colorScheme.colors.primary}33)`,
                        border: `1px solid ${colorScheme.colors.accentFrom}4D`,
                        boxShadow: `0 10px 15px -3px ${colorScheme.colors.accentFrom}33`,
                      }
                    : undefined
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 rounded-xl bg-neutral-800/30 animate-pulse"
            >
              <div className="flex-shrink-0 relative">
                <div className="w-16 h-16 bg-neutral-700/50 rounded-lg" />
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-neutral-700/50 rounded-full" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-700/50 rounded w-3/4" />
                <div className="h-3 bg-neutral-700/50 rounded w-1/2" />
              </div>
              <div className="flex-shrink-0">
                <div className="w-20 h-6 bg-neutral-700/50 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : topSongs?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-neutral-400">再生履歴はありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topSongs?.map((song, index) => (
            <div
              key={song.id}
              onClick={() => handlePlay(song.id)}
              className="group flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-800/50 transition-all duration-300 cursor-pointer"
            >
              <div className="flex-shrink-0 relative">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <Image
                    fill
                    src={song.image_path}
                    alt={song.title}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div
                  className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: hasHydrated
                      ? `${colorScheme.colors.accentFrom}CC`
                      : "#7c3aedCC",
                  }}
                >
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold truncate">
                  {song.title}
                </h4>
                <p className="text-neutral-400 text-sm truncate">
                  {song.author}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span
                  className="px-3 py-1 rounded-full text-sm whitespace-nowrap"
                  style={{
                    backgroundColor: hasHydrated
                      ? `${colorScheme.colors.accentFrom}33`
                      : "#7c3aed33",
                    color: hasHydrated
                      ? `rgb(${colorScheme.colors.theme300})`
                      : "rgb(196, 181, 253)",
                  }}
                >
                  {song.play_count}回再生
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// displayName を設定
TopPlayedSongs.displayName = "TopPlayedSongs";

export default TopPlayedSongs;
