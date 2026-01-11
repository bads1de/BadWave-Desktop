"use client";

import React, { memo, useMemo } from "react";
import type { DailyActivity } from "@/types/stats";

interface ContributionHeatmapProps {
  dailyActivity: DailyActivity[] | null;
  colorScheme?: {
    colors: {
      accentFrom: string;
      primary: string;
    };
  };
}

// 色の濃淡レベル (0=なし, 1=薄い, 2, 3, 4=濃い)
const getColorLevel = (count: number, maxCount: number): number => {
  if (count === 0) return 0;
  if (maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};

// デフォルトカラー (GitHub風グリーン)
const DEFAULT_COLORS = [
  "#161b22", // level 0: 背景
  "#0e4429", // level 1
  "#006d32", // level 2
  "#26a641", // level 3
  "#39d353", // level 4
];

const ContributionHeatmap: React.FC<ContributionHeatmapProps> = memo(
  ({ dailyActivity, colorScheme }) => {
    // 過去1年分の日付を生成
    const { weeks, monthLabels, maxCount, activityMap } = useMemo(() => {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // アクティビティをMapに変換
      const activityMap = new Map<string, number>();
      dailyActivity?.forEach((item) => {
        activityMap.set(item.date, item.count);
      });

      // 最大値を計算
      const maxCount = Math.max(
        1,
        ...(dailyActivity?.map((d) => d.count) ?? [1])
      );

      // 週ごとにグループ化
      const weeks: { date: Date; count: number }[][] = [];
      let currentWeek: { date: Date; count: number }[] = [];

      // 最初の週の開始日（日曜日）に調整
      const startDate = new Date(oneYearAgo);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      const currentDate = new Date(startDate);
      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const count = activityMap.get(dateStr) ?? 0;

        currentWeek.push({ date: new Date(currentDate), count });

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 残りの日があれば追加
      if (currentWeek.length > 0) {
        weeks.push(currentWeek);
      }

      // 月ラベル計算
      const monthLabels: { month: string; weekIndex: number }[] = [];
      let lastMonth = -1;
      weeks.forEach((week, weekIndex) => {
        const firstDayOfWeek = week[0];
        if (firstDayOfWeek) {
          const month = firstDayOfWeek.date.getMonth();
          if (month !== lastMonth) {
            const monthNames = [
              "1月",
              "2月",
              "3月",
              "4月",
              "5月",
              "6月",
              "7月",
              "8月",
              "9月",
              "10月",
              "11月",
              "12月",
            ];
            monthLabels.push({ month: monthNames[month], weekIndex });
            lastMonth = month;
          }
        }
      });

      return { weeks, monthLabels, maxCount, activityMap };
    }, [dailyActivity]);

    // カラーパレット生成
    const colors = useMemo(() => {
      if (!colorScheme) return DEFAULT_COLORS;
      // テーマカラーに基づいて濃淡を生成
      const baseColor = colorScheme.colors.accentFrom;
      return [
        "#161b22",
        `${baseColor}40`,
        `${baseColor}70`,
        `${baseColor}a0`,
        baseColor,
      ];
    }, [colorScheme]);

    const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

    return (
      <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-800/60 backdrop-blur-xl border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          🌱 リスニングアクティビティ
        </h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-max">
            {/* 月ラベル */}
            <div
              className="relative ml-8 mb-1"
              style={{ height: "16px", width: weeks.length * 14 }}
            >
              {monthLabels.map((label, idx) => (
                <div
                  key={idx}
                  className="text-xs text-neutral-400 absolute"
                  style={{
                    left: label.weekIndex * 14,
                  }}
                >
                  {label.month}
                </div>
              ))}
            </div>

            <div className="flex">
              {/* 曜日ラベル */}
              <div className="flex flex-col gap-[2px] mr-1">
                {dayLabels.map((day, idx) => (
                  <div
                    key={day}
                    className="text-xs text-neutral-400 h-[12px] flex items-center"
                    style={{ visibility: idx % 2 === 1 ? "visible" : "hidden" }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* ヒートマップ */}
              <div className="flex gap-[2px]">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[2px]">
                    {week.map((day, dayIdx) => {
                      const level = getColorLevel(day.count, maxCount);
                      const dateStr = day.date.toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                      return (
                        <div
                          key={dayIdx}
                          className="w-[12px] h-[12px] rounded-sm cursor-pointer transition-transform hover:scale-125"
                          style={{ backgroundColor: colors[level] }}
                          title={`${dateStr}: ${day.count}回再生`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* 凡例 */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-neutral-400">
              <span>Less</span>
              {colors.map((color, idx) => (
                <div
                  key={idx}
                  className="w-[12px] h-[12px] rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ContributionHeatmap.displayName = "ContributionHeatmap";

export default ContributionHeatmap;
