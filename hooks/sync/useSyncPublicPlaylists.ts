import { useCallback } from "react";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { useSyncBase } from "./useSyncBase";

/**
 * 公開プレイリスト（Public Playlists）をバックグラウンドで同期する Syncer フック
 */
export const useSyncPublicPlaylists = (
  limit: number = 6,
  options?: { autoSync?: boolean },
) => {
  const { autoSync = true } = options ?? {};
  const queryClient = useQueryClient();

  const syncFn = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data) return { success: true as const, count: 0 };

    // 1. プレイリストメタデータを保存
    await electronAPI.cache.syncPlaylists(data);

    // 2. セクション順序を保存
    const cacheKey = "home_public_playlists";
    await electronAPI.cache.syncSection({ key: cacheKey, data });

    // キャッシュ無効化
    await queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.publicPlaylists, limit],
    });

    return { success: true as const, count: data.length };
  }, [limit, queryClient]);

  return useSyncBase(syncFn, { autoSync });
};
