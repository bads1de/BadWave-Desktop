import { useCallback } from "react";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { useSyncBase } from "./useSyncBase";

/**
 * 最新曲（Latest Songs）をバックグラウンドで同期する Syncer フック
 */
export const useSyncLatestSongs = (
  limit: number = 12,
  options?: { autoSync?: boolean },
) => {
  const { autoSync = true } = options ?? {};
  const queryClient = useQueryClient();

  const syncFn = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data) return { success: true as const, count: 0 };

    // 1. メタデータを保存
    await electronAPI.cache.syncSongsMetadata(data);

    // 2. セクション順序を保存
    const cacheKey = "home_latest_songs";
    await electronAPI.cache.syncSection({ key: cacheKey, data });

    // キャッシュ無効化
    await queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.songs, limit],
    });

    return { success: true as const, count: data.length };
  }, [limit, queryClient]);

  return useSyncBase(syncFn, { autoSync });
};
