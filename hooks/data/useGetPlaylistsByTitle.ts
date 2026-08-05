import { Playlist } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";

/**
 * タイトルでパブリックプレイリストを検索するカスタムフック (オフライン対応)
 *
 * オフライン時はクエリが pause され、PersistQueryClient により
 * キャッシュから即座に表示されます。
 *
 * @param title 検索するタイトル
 */
const useGetPlaylistsByTitle = (title: string) => {
  const {
    data: playlists = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Playlist[]>({
    queryKey: [CACHED_QUERIES.playlists, "search", title],
    enabled: !!title,
    offlineFallback: [],
    webFn: async () => {
      // タイトルが空の場合は空の配列を返す
      if (!title) {
        return [];
      }

      const { data, error } = await createClient()
        .from(TABLES.PLAYLISTS)
        .select("*")
        .eq("is_public", true)
        .ilike("title", `%${title}%`)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return (data as Playlist[]) || [];
    },
  });

  return { playlists, isLoading, error, isPaused };
};

export default useGetPlaylistsByTitle;