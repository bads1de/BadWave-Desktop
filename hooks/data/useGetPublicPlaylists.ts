import { Playlist } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";

/**
 * パブリックプレイリストを取得するカスタムフック (クライアントサイド)
 *
 * Electron環境ではローカルキャッシュから、Web環境では Supabase から取得。
 * オフライン時はクエリが pause され、PersistQueryClient により
 * キャッシュから即座に表示されます。
 */
const useGetPublicPlaylists = (initialData?: Playlist[], limit: number = 6) => {
  const {
    data: playlists = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Playlist[]>({
    queryKey: [CACHED_QUERIES.publicPlaylists, limit],
    electron: {
      sectionKey: "home_public_playlists",
      sectionType: "playlists",
    },
    emptySectionFallback: [],
    offlineFallback: [],
    initialData,
    networkMode: "always",
    webFn: async () => {
      const { data, error } = await createClient()
        .from(TABLES.PLAYLISTS)
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return (data as Playlist[]) || [];
    },
  });

  return { playlists, isLoading, error, isPaused };
};

export default useGetPublicPlaylists;