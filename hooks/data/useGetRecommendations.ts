import { Song, SongWithRecommendation } from "@/types";
import { CACHED_QUERIES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useUser } from "@/hooks/auth/useUser";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { mapRecommendationToSong } from "@/libs/songUtils";
import { getErrorMessage } from "@/libs/utils/error";

/**
 * おすすめ曲を取得するカスタムフック (クライアントサイド)
 *
 * Electron環境ではローカルキャッシュから、Web環境では Supabase から取得。
 * オフライン時はクエリが pause され、PersistQueryClient により
 * キャッシュから即座に表示されます。
 */
const useGetRecommendations = (initialData?: Song[], limit: number = 10) => {
  const { user } = useUser();

  const {
    data: recommendations = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Song[]>({
    queryKey: [CACHED_QUERIES.recommendations, user?.id, limit],
    electron: {
      sectionKey: `home_recommendations_${user?.id ?? ""}`,
      sectionType: "songs",
    },
    emptySectionFallback: [],
    offlineFallback: [],
    initialData,
    enabled: !!user?.id,
    networkMode: "always",
    webFn: async () => {
      // ユーザーがログインしていない場合は空配列を返す
      if (!user?.id) {
        return [];
      }

      try {
        const { data, error } = await createClient().rpc(
          "get_recommendations",
          {
            p_user_id: user.id,
            p_limit: limit,
          }
        );

        if (error) {
          throw new Error(getErrorMessage(error));
        }

        if (!data) return [];

        return data.map((item: SongWithRecommendation) =>
          mapRecommendationToSong(item, user.id)
        );
      } catch (e) {
        console.error("Exception in getRecommendations:", e);
        return [];
      }
    },
  });

  return { recommendations, isLoading, error, isPaused };
};

export default useGetRecommendations;