import { createClient } from "@/libs/supabase/client";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHED_QUERIES, TABLES } from "@/constants";
import { useUser } from "@/hooks/auth/useUser";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { isNetworkError } from "@/libs/electron/index";
import { isLocalSongId } from "@/libs/songUtils";

/** 曲がプレイリストに含まれるかを確認する */
const usePlaylistSongStatus = (songId: string, playlists: { id: string }[]) => {
  const supabaseClient = createClient();
  const { user } = useUser();
  const { isOnline } = useNetworkStatus();
  const playlistIds = playlists.map((playlist) => playlist.id);

  const {
    data: isInPlaylist = {},
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlistSongStatus, songId, playlistIds, user?.id],
    queryFn: async () => {
      if (!user?.id || !songId || playlistIds.length === 0) {
        return {};
      }

      const { data, error } = await supabaseClient
        .from(TABLES.PLAYLIST_SONGS)
        .select("playlist_id")
        .eq("user_id", user.id)
        .eq("song_id", songId)
        .in("playlist_id", playlistIds);

      if (error) {
        // オフラインまたはネットワークエラーの場合は空オブジェクトを返す
        if (!onlineManager.isOnline() || isNetworkError(error)) {
          return {}; // キャッシュがあればそれを使用
        }
        console.error("Error fetching playlist song status:", error);
        throw new Error("プレイリスト曲の状態の取得に失敗しました");
      }

      // 結果をプレイリストIDをキーとしたオブジェクトに変換
      const result: Record<string, boolean> = {};
      playlistIds.forEach((id) => {
        result[id] = false;
      });

      // 曲が含まれているプレイリストを設定
      data.forEach((item) => {
        result[item.playlist_id] = true;
      });

      return result;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    // オフライン時はフェッチをスキップ
    enabled:
      isOnline &&
      !!user?.id &&
      !!songId &&
      playlistIds.length > 0 &&
      !isLocalSongId(songId),
  });

  return {
    isInPlaylist,
    isLoading,
    error,
  };
};

export default usePlaylistSongStatus;
