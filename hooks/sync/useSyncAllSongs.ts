import { useCallback } from "react";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { useSyncBase } from "./useSyncBase";

/**
 * 全曲をバックグラウンドで同期する Syncer フック
 *
 * Supabase から曲をページ分割で取得し、ローカル DB に保存します。
 * Latest Songs の同期とは異なり、全曲を対象とします。
 */
export const useSyncAllSongs = (options?: { autoSync?: boolean }) => {
  const { autoSync = true } = options ?? {};
  const queryClient = useQueryClient();

  const syncFn = useCallback(async () => {
    const supabase = createClient();
    const pageSize = 100;
    let offset = 0;
    let totalSynced = 0;
    let hasMore = true;

    // ページ分割で全曲を取得・同期
    while (hasMore) {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        await electronAPI.cache.syncSongsMetadata(data);
        totalSynced += data.length;
        offset += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    // キャッシュ無効化（ページネーションクエリ）
    await queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.songs, "paginated"],
    });

    return { success: true as const, count: totalSynced };
  }, [queryClient]);

  return useSyncBase(syncFn, { autoSync });
};
