import { Song } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";
import { subMonths, subWeeks, subDays } from "date-fns";

/**
 * トレンド曲を取得するカスタムフック
 *
 * Electron環境ではローカルキャッシュから、Web環境では Supabase から取得。
 * オフライン時はクエリが pause され、PersistQueryClient により
 * キャッシュから即座に表示されます。
 */
const useGetTrendSongs = (
  period: "all" | "month" | "week" | "day" = "all",
  initialData?: Song[]
) => {
  const {
    data: trends = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Song[]>({
    queryKey: [CACHED_QUERIES.trendSongs, period],
    electron: { sectionKey: `trend_${period}`, sectionType: "songs" },
    emptySectionFallback: [],
    offlineFallback: [],
    initialData,
    networkMode: "always",
    webFn: async () => {
      let query = createClient().from(TABLES.SONGS).select("*");

      switch (period) {
        case "month":
          query = query.gte("created_at", subMonths(new Date(), 1).toISOString());
          break;
        case "week":
          query = query.gte("created_at", subWeeks(new Date(), 1).toISOString());
          break;
        case "day":
          query = query.gte("created_at", subDays(new Date(), 1).toISOString());
          break;
      }

      const { data, error } = await query
        .order("count", { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return (data as Song[]) || [];
    },
  });

  return { trends, isLoading, error, isPaused };
};

export default useGetTrendSongs;