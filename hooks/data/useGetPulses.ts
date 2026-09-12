import { Pulse } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { normalizeIds } from "@/libs/utils/normalizeIds";

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
    // キャッシュ済みデータにも適用されるため、既存キャッシュの数値IDもここで揃う
    select: normalizeIds,
    webFn: async () => {
      const { data, error } = await createClient()
        .from(TABLES.PULSES)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error("Pulseの取得に失敗しました");
      }

      // pulses.id は Supabase では数値で返るため文字列に揃える
      return normalizeIds(data);
    },
  });

  return { pulses, isLoading, error, isPaused };
};

export default useGetPulses;