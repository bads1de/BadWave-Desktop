import { useCallback } from "react";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { subMonths, subWeeks, subDays } from "date-fns";
import { useSyncBase } from "./useSyncBase";

/**
 * トレンド情報をバックグラウンドで同期する Syncer フック
 */
export const useSyncTrends = (
  period: "all" | "month" | "week" | "day" = "all",
  options?: { autoSync?: boolean },
) => {
  const { autoSync = true } = options ?? {};
  const queryClient = useQueryClient();

  const syncFn = useCallback(async () => {
    const supabase = createClient();
    let query = supabase.from("songs").select("*");

    switch (period) {
      case "month":
        query = query.filter(
          "created_at",
          "gte",
          subMonths(new Date(), 1).toISOString(),
        );
        break;
      case "week":
        query = query.filter(
          "created_at",
          "gte",
          subWeeks(new Date(), 1).toISOString(),
        );
        break;
      case "day":
        query = query.filter(
          "created_at",
          "gte",
          subDays(new Date(), 1).toISOString(),
        );
        break;
    }

    const { data, error } = await query
      .order("count", { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!data) return { success: true as const, count: 0 };

    // 1. メタデータを保存
    await electronAPI.cache.syncSongsMetadata(data);

    // 2. セクション順序を保存
    const cacheKey = `trend_${period}`;
    await electronAPI.cache.syncSection({ key: cacheKey, data });

    // キャッシュ無効化
    await queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.trendSongs, period],
    });

    return { success: true as const, count: data.length };
  }, [period, queryClient]);

  return useSyncBase(syncFn, { autoSync });
};
