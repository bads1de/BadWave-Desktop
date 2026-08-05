import { Song } from "@/types";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron";
import { useSectionQuery } from "@/libs/query/useSectionQuery";
import { extractSongsFromJoin } from "@/libs/songUtils";

/**
 * プレイリストの曲を取得するカスタムフック (ローカルファースト)
 *
 * Electron環境では常にローカルDBから読み込みます。
 * 同期は useSyncPlaylistSongs フックが担当します。
 *
 * networkMode: "always" により、オフライン時でも queryFn が実行され、
 * SQLite キャッシュからの取得が可能になります。
 */
const useGetPlaylistSongs = (playlistId?: string) => {
  const {
    data: songs = [],
    isLoading,
    error,
    isPaused,
  } = useSectionQuery<Song[]>({
    queryKey: [CACHED_QUERIES.playlists, playlistId, "songs"],
    enabled: !!playlistId,
    networkMode: "always",
    electron: {
      getLocal: () =>
        electronAPI.cache.getCachedPlaylistSongs(
          playlistId ?? ""
        ) as Promise<Song[]>,
    },
    webFn: async () => {
      if (!playlistId) return [];

      const { data, error } = await createClient()
        .from(TABLES.PLAYLIST_SONGS)
        .select("*, songs(*)")
        .eq("playlist_id", playlistId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error("プレイリストの曲の取得に失敗しました");
      }

      if (!data) return [];

      return extractSongsFromJoin(data);
    },
  });

  return { songs, isLoading, error, isPaused };
};

export default useGetPlaylistSongs;