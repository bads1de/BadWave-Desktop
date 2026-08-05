import { TopPlayedSong } from "@/types";
import { Period } from "@/types/stats";
import { CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";

/**
 * ユーザーの再生数が多い曲を取得するカスタムフック
 *
 * オフライン時はクエリが pause され、PersistQueryClient により
 * キャッシュから即座に表示されます。
 */
const useGetTopPlayedSongs = (userId?: string, period: Period = "day") => {
  const {
    data: topSongs = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<TopPlayedSong[]>({
    queryKey: [CACHED_QUERIES.getTopSongs, userId, period],
    enabled: !!userId,
    keepPreviousData: true,
    offlineFallback: [],
    webFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await createClient().rpc("get_top_songs", {
        p_user_id: userId,
        p_period: period,
      });

      if (error) {
        throw new Error(
          `再生履歴の取得に失敗しました: ${getErrorMessage(error)}`
        );
      }

      return (data || []) as TopPlayedSong[];
    },
  });

  return { topSongs, isLoading, error, isPaused };
};

export default useGetTopPlayedSongs;