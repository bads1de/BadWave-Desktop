import { Playlist } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";
import { normalizeIds } from "@/libs/utils/normalizeIds";

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
    // キャッシュ済みデータにも適用されるため、既存キャッシュの数値IDもここで揃う
    select: normalizeIds,
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

      // playlists.id は Supabase では数値で返るため文字列に揃える
      return normalizeIds(data);
    },
  });

  return { playlists, isLoading, error, isPaused };
};

export default useGetPlaylistsByTitle;