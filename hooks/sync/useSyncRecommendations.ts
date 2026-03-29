import { useCallback } from "react";
import { useUser } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { Song, SongWithRecommendation } from "@/types";
import { useSyncBase } from "./useSyncBase";

/**
 * おすすめ曲（Recommendations）をバックグラウンドで同期する Syncer フック
 */
export const useSyncRecommendations = (
  limit: number = 10,
  options?: { autoSync?: boolean },
) => {
  const { autoSync = true } = options ?? {};
  const { user } = useUser();
  const queryClient = useQueryClient();

  const syncFn = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_recommendations", {
      p_user_id: user!.id,
      p_limit: limit,
    });

    if (error) throw error;
    if (!data) return { success: true as const, count: 0 };

    const songs: Song[] = data.map((item: SongWithRecommendation) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      song_path: item.song_path,
      image_path: item.image_path,
      genre: item.genre,
      count: item.count,
      like_count: item.like_count,
      created_at: item.created_at,
      user_id: user!.id,
    }));

    // 1. メタデータを保存
    await electronAPI.cache.syncSongsMetadata(songs);

    // 2. セクション順序を保存
    const cacheKey = `home_recommendations_${user!.id}`;
    await electronAPI.cache.syncSection({ key: cacheKey, data: songs });

    // キャッシュ無効化
    await queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.recommendations, user!.id, limit],
    });

    return { success: true as const, count: songs.length };
  }, [user?.id, limit, queryClient]);

  return useSyncBase(syncFn, {
    autoSync,
    canSync: () => !!user?.id,
  });
};
