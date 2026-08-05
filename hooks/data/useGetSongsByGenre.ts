import { Song } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";

/**
 * 指定したジャンルの曲一覧を取得するカスタムフック (オフライン対応)
 *
 * オフライン時はクエリが pause され、PersistQueryClient により
 * キャッシュから即座に表示されます。
 *
 * @param genre ジャンル名またはジャンル名の配列
 */
const useGetSongsByGenre = (genre: string | string[]) => {
  // ジャンルが文字列の場合は、カンマで分割して配列に変換
  const genreArray =
    typeof genre === "string" ? genre.split(",").map((g) => g.trim()) : genre;

  const {
    data: songs = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Song[]>({
    queryKey: [CACHED_QUERIES.songsByGenres, genreArray.join(",")],
    enabled: genreArray.length > 0,
    webFn: async () => {
      if (genreArray.length === 0) {
        return [];
      }

      const { data, error } = await createClient()
        .from(TABLES.SONGS)
        .select("*")
        .or(genreArray.map((g) => `genre.ilike.%${g}%`).join(","))
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return (data as Song[]) || [];
    },
  });

  return { songs, isLoading, error, isPaused };
};

export default useGetSongsByGenre;