import { Spotlight } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";

/**
 * スポットライトデータを取得するカスタムフック (クライアントサイド)
 *
 * Electron環境ではローカルキャッシュから、Web環境では Supabase から取得。
 * オフライン時はクエリが pause され、PersistQueryClient により
 * キャッシュから即座に表示されます。
 */
const useGetSpotlight = (initialData?: Spotlight[]) => {
  const {
    data: spotlightData = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Spotlight[]>({
    queryKey: [CACHED_QUERIES.spotlight],
    electron: { sectionKey: "home_spotlight", sectionType: "spotlights" },
    emptySectionFallback: [],
    offlineFallback: [],
    initialData,
    networkMode: "always",
    webFn: async () => {
      const { data, error } = await createClient()
        .from(TABLES.SPOTLIGHTS)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return (data as Spotlight[]) || [];
    },
  });

  return { spotlightData, isLoading, error, isPaused };
};

export default useGetSpotlight;