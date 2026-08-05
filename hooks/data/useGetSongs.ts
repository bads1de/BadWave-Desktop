import { Song } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";

/**
 * 最新曲を取得するカスタムフック (クライアントサイド)
 *
 * Electron環境ではローカルキャッシュから、Web環境では Supabase から取得。
 * オフライン時はクエリが pause され、PersistQueryClient により
 * キャッシュから即座に表示されます。
 *
 * @param {Song[]} initialData - サーバーから取得した初期データ（Optional）
 * @param {number} limit - 取得する曲数の上限
 */
const useGetSongs = (initialData?: Song[], limit: number = 12) => {
  const {
    data: songs = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Song[]>({
    queryKey: [CACHED_QUERIES.songs, limit],
    electron: { sectionKey: "home_latest_songs", sectionType: "songs" },
    emptySectionFallback: [],
    offlineFallback: [],
    initialData,
    networkMode: "always",
    webFn: async () => {
      const { data, error } = await createClient()
        .from(TABLES.SONGS)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return (data as Song[]) || [];
    },
  });

  return { songs, isLoading, error, isPaused };
};

export default useGetSongs;
