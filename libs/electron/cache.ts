import { invokeOr } from "./common";
import type { SongForSync, PlaylistForSync, SpotlightForSync } from "@/types";
import type { SectionItem } from "@/types/local";

const NOT_IN_ELECTRON = "Not in Electron environment";

/** キャッシュ機能（オフラインライブラリ表示用） */
export const cache = {
  /** 曲のメタデータをローカルDBにキャッシュ（ダウンロード状態は上書きしない） */
  syncSongsMetadata: (
    songs: SongForSync[]
  ): Promise<{ success: boolean; count: number; error?: string }> =>
    invokeOr({ success: false, count: 0, error: NOT_IN_ELECTRON }, () =>
      window.electron.cache.syncSongsMetadata(songs)
    ),

  /** プレイリストをローカルDBにキャッシュ */
  syncPlaylists: (
    playlists: PlaylistForSync[]
  ): Promise<{ success: boolean; count: number; error?: string }> =>
    invokeOr({ success: false, count: 0, error: NOT_IN_ELECTRON }, () =>
      window.electron.cache.syncPlaylists(playlists)
    ),

  /** プレイリスト内の曲をローカルDBにキャッシュ（メタデータも同期） */
  syncPlaylistSongs: (data: {
    playlistId: string;
    songs: SongForSync[];
  }): Promise<{ success: boolean; count: number; error?: string }> =>
    invokeOr({ success: false, count: 0, error: NOT_IN_ELECTRON }, () =>
      window.electron.cache.syncPlaylistSongs(data)
    ),

  /** いいねした曲をローカルDBにキャッシュ（メタデータも同期） */
  syncLikedSongs: (data: {
    userId: string;
    songs: SongForSync[];
  }): Promise<{ success: boolean; count: number; error?: string }> =>
    invokeOr({ success: false, count: 0, error: NOT_IN_ELECTRON }, () =>
      window.electron.cache.syncLikedSongs(data)
    ),

  /** キャッシュからプレイリストを取得 */
  getCachedPlaylists: (userId: string): Promise<PlaylistForSync[]> =>
    invokeOr([], () => window.electron.cache.getCachedPlaylists(userId)),

  /** キャッシュからいいね曲を取得（ダウンロード状態付き） */
  getCachedLikedSongs: (userId: string): Promise<SongForSync[]> =>
    invokeOr([], () => window.electron.cache.getCachedLikedSongs(userId)),

  /** スポットライトのメタデータをローカルDBにキャッシュ */
  syncSpotlightsMetadata: (
    spotlights: SpotlightForSync[]
  ): Promise<{ success: boolean; count: number; error?: string }> =>
    invokeOr({ success: false, count: 0, error: NOT_IN_ELECTRON }, () =>
      window.electron.cache.syncSpotlightsMetadata(spotlights)
    ),

  /** セクション情報をローカルDBにキャッシュ (itemIdsの保存) */
  syncSection: (data: {
    key: string;
    data: SectionItem[];
  }): Promise<{ success: boolean; count: number; error?: string }> =>
    invokeOr({ success: false, count: 0, error: NOT_IN_ELECTRON }, () =>
      window.electron.cache.syncSection(data)
    ),

  /** キャッシュからプレイリスト内の曲を取得（ダウンロード状態付き） */
  getCachedPlaylistSongs: (playlistId: string): Promise<SongForSync[]> =>
    invokeOr([], () =>
      window.electron.cache.getCachedPlaylistSongs(playlistId)
    ),

  /**
   * キャッシュからセクションデータを取得。
   * 要素の型はセクション種別に依存するため呼び出し側で型引数を指定する
   * (未指定時は SectionItem[])。実際の写像は IPC 応答が担う。
   */
  getSectionData: <T = SectionItem[]>(
    key: string,
    type: "songs" | "spotlights" | "playlists"
  ): Promise<T> =>
    invokeOr([], () =>
      window.electron.cache.getSectionData(key, type)
    ) as unknown as Promise<T>,

  // --- Local-first Mutation Methods ---

  /** いいねを追加（ローカルDB） */
  addLikedSong: (data: {
    userId: string;
    songId: string;
  }): Promise<{ success: boolean; error?: string }> =>
    invokeOr({ success: false, error: NOT_IN_ELECTRON }, () =>
      window.electron.cache.addLikedSong(data)
    ),

  /** いいねを削除（ローカルDB） */
  removeLikedSong: (data: {
    userId: string;
    songId: string;
  }): Promise<{ success: boolean; error?: string }> =>
    invokeOr({ success: false, error: NOT_IN_ELECTRON }, () =>
      window.electron.cache.removeLikedSong(data)
    ),

  /** いいね状態を取得（ローカルDB） */
  getLikeStatus: (data: {
    userId: string;
    songId: string;
  }): Promise<{ isLiked: boolean; error?: string }> =>
    invokeOr({ isLiked: false, error: NOT_IN_ELECTRON }, () =>
      window.electron.cache.getLikeStatus(data)
    ),

  /** プレイリストに曲を追加（ローカルDB） */
  addPlaylistSong: (data: {
    playlistId: string;
    songId: string;
  }): Promise<{ success: boolean; error?: string }> =>
    invokeOr({ success: false, error: NOT_IN_ELECTRON }, () =>
      window.electron.cache.addPlaylistSong(data)
    ),

  /** プレイリストから曲を削除（ローカルDB） */
  removePlaylistSong: (data: {
    playlistId: string;
    songId: string;
  }): Promise<{ success: boolean; error?: string }> =>
    invokeOr({ success: false, error: NOT_IN_ELECTRON }, () =>
      window.electron.cache.removePlaylistSong(data)
    ),

  /** 単一の曲情報を取得（ローカルDB） */
  getSongById: (songId: string): Promise<SongForSync | null> =>
    invokeOr(null, () => window.electron.cache.getSongById(songId)),

  /** 単一のプレイリスト情報を取得（ローカルDB） */
  getPlaylistById: (playlistId: string): Promise<PlaylistForSync | null> =>
    invokeOr(null, () => window.electron.cache.getPlaylistById(playlistId)),

  /** ページネーション対応の曲取得（ローカルDB） */
  getSongsPaginated: (
    offset: number,
    limit: number
  ): Promise<SongForSync[]> =>
    invokeOr([], () =>
      window.electron.cache.getSongsPaginated(offset, limit)
    ),

  /** 曲の総件数を取得（ローカルDB） */
  getSongsTotalCount: (): Promise<number> =>
    invokeOr(0, () => window.electron.cache.getSongsTotalCount()),
};
