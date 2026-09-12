import { Song } from "@/types";
import type { Period } from "@/types/stats";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";
import { normalizeIds } from "@/libs/utils/normalizeIds";
import { subMonths, subWeeks, subDays } from "date-fns";

/** トレンド曲を取得する (Electronはキャッシュ、WebはSupabase) */
const useGetTrendSongs = (
  period: Period = "all",
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
    // キャッシュ済みデータにも適用されるため、既存キャッシュの数値IDもここで揃う
    select: normalizeIds,
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

      // songs.id は Supabase では数値で返るため文字列に揃える
      return normalizeIds(data);
    },
  });

  return { trends, isLoading, error, isPaused };
};

export default useGetTrendSongs;