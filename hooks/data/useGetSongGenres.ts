import { Song } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";

/**
 * 指定されたジャンルに一致する曲を取得するカスタムフック
 *
 * @param genres 取得する曲のジャンルの配列
 * @param excludeId 除外する曲のID（オプション）
 */
const useGetSongsByGenres = (genres: string[], excludeId?: string) => {
  const {
    data: songGenres = [],
    isLoading,
    isPaused,
  } = useSectionQuery<Song[]>({
    queryKey: [CACHED_QUERIES.songsByGenres, genres, excludeId],
    enabled: genres.length > 0,
    offlineFallback: [],
    webFn: async () => {
      if (genres.length === 0) {
        return [];
      }

      let query = createClient().from(TABLES.SONGS).select("*");

      // ジャンルのOR条件を構築
      const genreConditions = genres.map((genre) => `genre.ilike.%${genre}%`);
      query = query.or(genreConditions.join(","));

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      query = query.limit(3);

      const { data, error } = await query;

      if (error) {
        throw new Error(
          `ジャンルによる曲の取得に失敗しました: ${getErrorMessage(error)}`
        );
      }

      return (data as Song[]) || [];
    },
  });

  return { isLoading, songGenres, isPaused };
};

export default useGetSongsByGenres;