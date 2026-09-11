import { Spotlight } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";

/** スポットライトを取得する (Electronはキャッシュ、WebはSupabase) */
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