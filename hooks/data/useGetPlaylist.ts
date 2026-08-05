import { Playlist } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron";
import { useSectionQuery } from "@/libs/query/useSectionQuery";

/**
 * プレイリスト情報を取得するカスタムフック
 *
 * Electron環境ではローカルDB (キャッシュ) を優先し、見つからない場合のみ
 * Supabase から取得します。オフライン時はクエリが pause され、
 * PersistQueryClient によりキャッシュから即座に表示されます。
 */
const useGetPlaylist = (playlistId?: string) => {
  const {
    data: playlist,
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Playlist>({
    queryKey: [CACHED_QUERIES.playlists, playlistId],
    enabled: !!playlistId,
    electron: {
      getLocal: async () => {
        try {
          return (await electronAPI.cache.getPlaylistById(
            playlistId ?? ""
          )) as Playlist | null;
        } catch (e) {
          console.error("[useGetPlaylist] Local fetch failed:", e);
          return undefined;
        }
      },
    },
    webFn: async () => {
      if (!playlistId) {
        return null;
      }

      const { data, error } = await createClient()
        .from(TABLES.PLAYLISTS)
        .select("*")
        .eq("id", playlistId)
        .maybeSingle();

      if (!data) {
        return null;
      }

      if (error) {
        throw new Error("プレイリストの取得に失敗しました");
      }

      return data as Playlist;
    },
  });

  return { playlist, isLoading, error, isPaused };
};

export default useGetPlaylist;