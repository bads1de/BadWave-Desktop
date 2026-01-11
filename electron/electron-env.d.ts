/// <reference types="electron" />

// オフライン曲の型定義
interface OfflineSong {
  id: string;
  user_id: string;
  title: string;
  author: string;
  song_path: string; // ローカルファイルパス (file://...)
  image_path: string | null;
  original_song_path: string | null;
  original_image_path: string | null;
  duration: number | null;
  genre: string | null;
  lyrics: string | null;
  created_at: string | null;
  downloaded_at: Date | null;
}

// ダウンロード時に渡される曲データの型定義
interface SongDownloadPayload {
  id: string;
  userId: string;
  title: string;
  author: string;
  song_path: string; // リモートURL
  image_path: string; // リモートURL
  duration?: number;
  genre?: string;
  lyrics?: string;
  created_at: string;
}

// Electronのウィンドウオブジェクトに公開されるAPIの型定義
interface ElectronAPI {
  // アプリケーション情報
  appInfo: {
    // アプリケーションのバージョンを取得
    getVersion: () => string;
    // 実行環境がElectronかどうかを判定
    isElectron: boolean;
    // プラットフォーム情報
    platform: NodeJS.Platform;
  };

  // ウィンドウ操作
  window: {
    // ウィンドウを最小化
    minimize: () => Promise<void>;
    // ウィンドウを最大化/元のサイズに戻す
    maximize: () => Promise<void>;
    // ウィンドウを閉じる
    close: () => Promise<void>;
  };

  // 設定ストア操作
  store: {
    // 設定値を取得
    get: <T>(key: string) => Promise<T>;
    // 設定値を保存
    set: <T>(key: string, value: T) => Promise<boolean>;
  };

  // メディア制御
  media: {
    // メディア制御イベントのリスナーを登録
    onMediaControl: (callback: (action: string) => void) => () => void;
  };

  // オフライン機能 (Phase 2)
  offline: {
    // オフライン（ダウンロード済み）の曲を全て取得
    getSongs: () => Promise<OfflineSong[]>;
    checkStatus: (
      songId: string
    ) => Promise<{ isDownloaded: boolean; localPath?: string }>;
    // オフライン曲を削除（ファイル + DB）
    deleteSong: (
      songId: string
    ) => Promise<{ success: boolean; error?: string }>;
    // 曲をダウンロード（メタデータ付き）
    downloadSong: (
      song: SongDownloadPayload
    ) => Promise<{ success: boolean; localPath?: string; error?: string }>;
  };

  // 開発用ユーティリティ
  dev: {
    // オフラインシミュレーションを切り替え
    toggleOfflineSimulation: () => Promise<{ isOffline: boolean }>;
    // 現在のオフラインシミュレーション状態を取得
    getOfflineSimulationStatus: () => Promise<{ isOffline: boolean }>;
    // オフラインシミュレーションを明示的に設定
    setOfflineSimulation: (offline: boolean) => Promise<{ isOffline: boolean }>;
  };

  // キャッシュ機能（オフラインライブラリ表示用）
  cache: {
    // 曲のメタデータをキャッシュ
    syncSongsMetadata: (
      songs: any[]
    ) => Promise<{ success: boolean; count: number; error?: string }>;
    // プレイリストをキャッシュ
    syncPlaylists: (
      playlists: any[]
    ) => Promise<{ success: boolean; count: number; error?: string }>;
    // プレイリスト内の曲をキャッシュ
    syncPlaylistSongs: (data: {
      playlistId: string;
      songs: any[];
    }) => Promise<{ success: boolean; count: number; error?: string }>;
    // いいねをキャッシュ
    syncLikedSongs: (data: {
      userId: string;
      songs: any[];
    }) => Promise<{ success: boolean; count: number; error?: string }>;
    // キャッシュからプレイリストを取得
    getCachedPlaylists: (userId: string) => Promise<any[]>;
    // キャッシュからいいね曲を取得
    getCachedLikedSongs: (userId: string) => Promise<any[]>;
    // キャッシュからプレイリスト内の曲を取得
    getCachedPlaylistSongs: (playlistId: string) => Promise<any[]>;
    // Local-first mutation methods
    addLikedSong: (data: {
      userId: string;
      songId: string;
    }) => Promise<{ success: boolean; error?: string }>;
    removeLikedSong: (data: {
      userId: string;
      songId: string;
    }) => Promise<{ success: boolean; error?: string }>;
    getLikeStatus: (data: {
      userId: string;
      songId: string;
    }) => Promise<{ isLiked: boolean; error?: string }>;
    addPlaylistSong: (data: {
      playlistId: string;
      songId: string;
    }) => Promise<{ success: boolean; error?: string }>;
    removePlaylistSong: (data: {
      playlistId: string;
      songId: string;
    }) => Promise<{ success: boolean; error?: string }>;
  };

  // 認証キャッシュ
  auth: {
    // ユーザー情報を保存
    saveCachedUser: (user: {
      id: string;
      email?: string;
      avatarUrl?: string;
    }) => Promise<any>;
    // ユーザー情報を取得
    getCachedUser: () => Promise<any>;
    // ユーザー情報をクリア
    clearCachedUser: () => Promise<any>;
  };

  // Discord RPC
  discord: {
    setActivity: (activity: any) => Promise<any>;
    clearActivity: () => Promise<void>;
  };

  // IPC通信
  ipc: {
    // メインプロセスにメッセージを送信し、応答を待つ
    invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
    // メインプロセスからのメッセージを受信
    on: <T = any>(
      channel: string,
      callback: (...args: T[]) => void
    ) => () => void;
    // メインプロセスにメッセージを送信（応答を待たない）
    send: (channel: string, ...args: any[]) => void;
  };
}

// グローバルなWindowオブジェクトにElectron APIを追加
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

// このファイルをモジュールとして扱うためのエクスポート
export {};
