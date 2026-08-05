import { Song } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { extractSongsFromJoin } from "@/libs/songUtils";

/**
 * ユーザーがいいねした曲を取得するカスタムフック (ローカルファースト)
 *
 * Electron環境では常にローカルDBから読み込みます。
 * 同期は useSyncLikedSongs フックが担当します。
 *
 * networkMode: "always" により、オフライン時でも queryFn が実行され、
 * SQLite キャッシュからの取得が可能になります。
 */
const useGetLikedSongs = (userId?: string) => {
  const {
    data: likedSongs = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Song[]>({
    queryKey: [CACHED_QUERIES.likedSongs, userId],
    enabled: !!userId,
    networkMode: "always",
    electron: {
      getLocal: () =>
        electronAPI.cache.getCachedLikedSongs(userId ?? "") as Promise<Song[]>,
    },
    webFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await createClient()
        .from(TABLES.LIKED_SONGS_REGULAR)
        .select("*, songs(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error("いいねした曲の取得に失敗しました");
      }

      if (!data) return [];

      return extractSongsFromJoin(data);
    },
  });

  return { likedSongs, isLoading, error, isPaused };
};

export default useGetLikedSongs;