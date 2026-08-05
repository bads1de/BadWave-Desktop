import { Playlist } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { useUser } from "@/hooks/auth/useUser";
import { electronAPI } from "@/libs/electron";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { getErrorMessage } from "@/libs/utils/error";

/**
 * ユーザーのプレイリスト一覧を取得するカスタムフック (ローカルファースト)
 *
 * Electron環境では常にローカルDBから読み込みます。
 * 同期は useSyncPlaylists フックが担当します。
 *
 * networkMode: "always" により、オフライン時でも queryFn が実行され、
 * SQLite キャッシュからの取得が可能になります。
 */
const useGetPlaylists = () => {
  const { user } = useUser();

  const {
    data: playlists = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Playlist[]>({
    queryKey: [CACHED_QUERIES.playlists, "user", user?.id],
    enabled: !!user?.id,
    networkMode: "always",
    electron: {
      getLocal: () =>
        electronAPI.cache.getCachedPlaylists(user?.id ?? "") as Promise<Playlist[]>,
    },
    webFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await createClient()
        .from(TABLES.PLAYLISTS)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      return (data as Playlist[]) || [];
    },
  });

  return { playlists, isLoading, error, isPaused };
};

export default useGetPlaylists;