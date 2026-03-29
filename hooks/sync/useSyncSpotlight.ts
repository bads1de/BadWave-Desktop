import { useCallback } from "react";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { useSyncBase } from "./useSyncBase";

/**
 * スポットライト情報をバックグラウンドで同期する Syncer フック
 */
export const useSyncSpotlight = (options?: { autoSync?: boolean }) => {
  const { autoSync = true } = options ?? {};
  const queryClient = useQueryClient();

  const syncFn = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("spotlights")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) return { success: true as const, count: 0 };

    // 1. メタデータを保存 (Videos)
    await electronAPI.cache.syncSpotlightsMetadata(data);

    // 2. セクション順序を保存
    const cacheKey = "home_spotlight";
    await electronAPI.cache.syncSection({ key: cacheKey, data });

    // キャッシュ無効化
    await queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.spotlight],
    });

    return { success: true as const, count: data.length };
  }, [queryClient]);

  return useSyncBase(syncFn, { autoSync });
};
