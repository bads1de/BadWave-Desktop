import { Song } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";

/**
 * タイトルで曲を検索するカスタムフック (オフライン対応)
 *
 * オフライン時はクエリが pause され、PersistQueryClient により
 * キャッシュから即座に表示されます。
 *
 * @param title 検索するタイトル
 */
const useGetSongsByTitle = (title: string) => {
  const {
    data: songs = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Song[]>({
    queryKey: [CACHED_QUERIES.songs, "search", title],
    offlineFallback: [],
    webFn: async () => {
      const query = createClient()
        .from(TABLES.SONGS)
        .select("*")
        .order("created_at", { ascending: false });

      // タイトルが指定されている場合のみフィルタを追加
      if (title) {
        query.ilike("title", `%${title}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return (data as Song[]) || [];
    },
  });

  return { songs, isLoading, error, isPaused };
};

export default useGetSongsByTitle;