import { Pulse } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";

/**
 * Pulseデータを取得するカスタムフック (オフライン対応)
 *
 * オフライン時はクエリが pause され、PersistQueryClient により
 * キャッシュから即座に表示されます。
 *
 * @param initialData - サーバーから取得した初期データ（オプション）
 */
const useGetPulses = (initialData?: Pulse[]) => {
  const {
    data: pulses = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Pulse[]>({
    queryKey: [CACHED_QUERIES.pulse],
    initialData,
    offlineFallback: [],
    webFn: async () => {
      const { data, error } = await createClient()
        .from(TABLES.PULSES)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error("Pulseの取得に失敗しました");
      }

      return (data as Pulse[]) || [];
    },
  });

  return { pulses, isLoading, error, isPaused };
};

export default useGetPulses;