import { useCallback } from "react";
import { useUser } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { Playlist } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { useSyncBase } from "./useSyncBase";

/**
 * Playlists をバックグラウンドで同期する Syncer フック
 *
 * このフックは、オンライン時に Supabase から最新のプレイリスト一覧を取得し、
 * ローカル DB に同期（Upsert）します。同期完了後、React Query のキャッシュを
 * 無効化して UI を更新します。
 *
 * @param options.autoSync - true の場合、マウント時およびオンライン復帰時に自動同期
 * @returns sync - 手動で同期をトリガーする関数
 * @returns isSyncing - 現在同期中かどうか
 */
export const useSyncPlaylists = (options?: { autoSync?: boolean }) => {
  const { autoSync = true } = options ?? {};
  const { user } = useUser();
  const queryClient = useQueryClient();

  const syncFn = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data) return { success: true as const, count: 0 };

    await electronAPI.cache.syncPlaylists(data as Playlist[]);

    // キャッシュを無効化してUIを更新
    await queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.playlists],
    });

    return { success: true as const, count: data.length };
  }, [user?.id, queryClient]);

  return useSyncBase(syncFn, {
    autoSync,
    canSync: () => !!user?.id,
  });
};
