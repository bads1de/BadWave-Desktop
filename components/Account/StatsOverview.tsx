"use client";

import React, { useState, memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useStats from "@/hooks/data/useStats";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";
import { type StatsPeriod } from "@/types/stats";
import { Flame, Clock, Music, TrendingUp, Calendar } from "lucide-react";
import ContributionHeatmap from "./ContributionHeatmap";

const PERIODS = [
  { value: "week" as const, label: "週間" },
  { value: "month" as const, label: "月間" },
  { value: "all" as const, label: "全期間" },
];

// パイチャート用カラーパレット
const GENRE_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#84cc16",
  "#a855f7",
];

const StatsOverview: React.FC = memo(() => {
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const { stats, isLoading } = useStats(period);
  const { getColorScheme, hasHydrated } = useColorSchemeStore();
  const colorScheme = getColorScheme();

  // 時間帯データを0-23時で整形
  const hourlyData = React.useMemo(() => {
    if (!stats?.hourly_activity) return [];
    const fullData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}時`,
      count: 0,
    }));
    stats.hourly_activity.forEach((item) => {
      fullData[item.hour].count = item.count;
    });
    return fullData;
  }, [stats?.hourly_activity]);

  // サマリーデータ
  const totalPlays = React.useMemo(() => {
    return (
      stats?.hourly_activity?.reduce((sum, item) => sum + item.count, 0) ?? 0
    );
  }, [stats?.hourly_activity]);

  const streak = stats?.streak ?? 0;

  const topGenre = React.useMemo(() => {
    if (!stats?.genre_stats || stats.genre_stats.length === 0) return "なし";
    return stats.genre_stats[0].genre;
  }, [stats?.genre_stats]);

  // ジャンルデータをrecharts用に整形
  const genreData = React.useMemo(() => {
    if (!stats?.genre_stats) return [];
    return stats.genre_stats.map((item) => ({
      name: item.genre,
      value: item.count,
    }));
  }, [stats?.genre_stats]);

  // 曜日別データを整形 (0=日曜 ~ 6=土曜)
  const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];
  const weeklyData = React.useMemo(() => {
    const fullData = DAY_NAMES.map((name) => ({ day: name, count: 0 }));
    if (!stats?.weekly_activity) return fullData;
    stats.weekly_activity.forEach((item) => {
      fullData[item.day_of_week].count = item.count;
    });
    return fullData;
  }, [stats?.weekly_activity]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* サマリーカードスケルトン */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-neutral-800/30 rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 bg-neutral-700/50 rounded w-1/2 mb-2" />
              <div className="h-8 bg-neutral-700/50 rounded w-3/4" />
            </div>
          ))}
        </div>
        {/* チャートスケルトン */}
        <div className="bg-neutral-800/30 rounded-xl p-6 animate-pulse">
          <div className="h-4 bg-neutral-700/50 rounded w-1/4 mb-4" />
          <div className="h-48 bg-neutral-700/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 期間切り替え */}
      <div className="flex justify-end">
        <div className="inline-flex h-10 items-center rounded-xl bg-neutral-800/50 backdrop-blur-xl border border-white/[0.02] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`
                inline-flex items-center justify-center whitespace-nowrap rounded-xl
                px-4 py-1.5 text-sm font-medium
                transition-all duration-300
                ${
                  period === p.value
                    ? "text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
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

      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-800/60 backdrop-blur-xl border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
            <Music className="w-4 h-4" />
            総再生数
          </div>
          <div className="text-2xl font-bold text-white">{totalPlays}</div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-800/60 backdrop-blur-xl border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
            <Flame className="w-4 h-4" />
            ストリーク
          </div>
          <div className="text-2xl font-bold text-white">{streak}日</div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-800/60 backdrop-blur-xl border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            最多ジャンル
          </div>
          <div className="text-2xl font-bold text-white truncate">
            {topGenre}
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-800/60 backdrop-blur-xl border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
            <Clock className="w-4 h-4" />
            トップ曲数
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.top_songs?.length ?? 0}
          </div>
        </div>
      </div>

      {/* コントリビューションヒートマップ */}
      <ContributionHeatmap
        dailyActivity={stats?.daily_activity ?? null}
        colorScheme={hasHydrated ? colorScheme : undefined}
      />

      {/* チャートセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 時間帯別アクティビティ */}
        <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-800/60 backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            時間帯別アクティビティ
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="hour"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  interval={5}
                />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="count"
                  fill={hasHydrated ? colorScheme.colors.accentFrom : "#8b5cf6"}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ジャンル分布 */}
        <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-800/60 backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            ジャンル分布
          </h3>
          <div className="h-64">
            {genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {genreData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={GENRE_COLORS[index % GENRE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-400">
                データがありません
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 曜日別アクティビティ */}
      <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-800/60 backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          曜日別アクティビティ
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="day"
                stroke="#9ca3af"
                fontSize={14}
                tickLine={false}
              />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar
                dataKey="count"
                fill={hasHydrated ? colorScheme.colors.primary : "#06b6d4"}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

StatsOverview.displayName = "StatsOverview";

export default StatsOverview;
