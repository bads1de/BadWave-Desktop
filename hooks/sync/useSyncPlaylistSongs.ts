import { useCallback, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { Song } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { useSyncBase } from "./useSyncBase";

/**
 * 特定のプレイリスト内の曲をバックグラウンドで同期する Syncer フック
 *
 * このフックは、オンライン時に Supabase から最新のプレイリスト曲を取得し、
 * ローカル DB に同期（Upsert）します。同期完了後、React Query のキャッシュを
 * 無効化して UI を更新します。
 *
 * @param playlistId - 同期対象のプレイリストID
 * @param options.autoSync - true の場合、マウント時およびオンライン復帰時に自動同期
 * @returns sync - 手動で同期をトリガーする関数
 * @returns isSyncing - 現在同期中かどうか
 */
export const useSyncPlaylistSongs = (
  playlistId?: string,
  options?: { autoSync?: boolean },
) => {
  const { autoSync = true } = options ?? {};
  const queryClient = useQueryClient();

  const syncFn = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("playlist_songs")
      .select("*, songs(*)")
      .eq("playlist_id", playlistId!)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data) return { success: true as const, count: 0 };

    const songs = data.map((item: Record<string, any>) => ({
      ...item.songs,
      songType: "regular",
    })) as Song[];

    await electronAPI.cache.syncPlaylistSongs({
      playlistId: String(playlistId),
      songs,
    });

    // キャッシュを無効化してUIを更新
    await queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.playlists, playlistId, "songs"],
    });

    return { success: true as const, count: songs.length };
  }, [playlistId, queryClient]);

  const { sync, isSyncing } = useSyncBase(syncFn, {
    autoSync: autoSync && !!playlistId,
    canSync: () => !!playlistId,
  });

  // プレイリストIDが変わった場合は初回同期フラグをリセット
  // (useSyncBase の内部リセットはできないため、playlistId を autoSync の条件に含めることで対応)

  return { sync, isSyncing };
};
