import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { getListeningStats } from "@/actions/getStats";
import type { StatsPeriod, UserStats } from "@/types/stats";

/**
 * ユーザーの聴取統計を取得するフック
 * @param period - 集計期間 ("week" | "month" | "all")
 * @returns 統計データとローディング状態
 */
const useStats = (period: StatsPeriod = "week") => {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<UserStats | null>({
    queryKey: [CACHED_QUERIES.userStats, period],
    queryFn: () => getListeningStats(period),
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    placeholderData: keepPreviousData,
  });

  return {
    stats,
    isLoading,
    error,
  };
};

export default useStats;
