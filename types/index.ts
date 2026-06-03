export type SongType = "regular";

export interface Song {
  id: string;
  user_id: string;
  author: string;
  title: string;
  song_path: string;
  image_path: string;
  local_song_path?: string;
  local_image_path?: string;
  local_video_path?: string;
  is_downloaded?: boolean;
  video_path?: string;
  genre?: string;
  count?: string;
  like_count?: string;
  lyrics?: string;
  duration?: number;
  public?: boolean;
  created_at: string;
}

export interface SongWithRecommendation extends Song {
  recommendation_score: string;
}

export interface UserDetails {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  avatar_url?: string;
  billing_address?: Record<string, unknown>;
  payment_method?: Record<string, unknown>;
}

export interface Playlist {
  id: string;
  user_id: string;
  image_path?: string;
  title: string;
  songs?: Song[];
  is_public: boolean;
  created_at: string;
  user_name?: string;
}

export interface PlaylistSong {
  id: string;
  user_id: string;
  playlist_id: string;
  song_id?: string;
  suno_song_id?: string;
  song_type: SongType;
}

export interface Spotlight {
  id: string;
  video_path: string;
  thumbnail_path?: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  local_video_path?: string;
  local_thumbnail_path?: string;
  created_at?: string;
}

export interface Pulse {
  id: string;
  title: string;
  genre: string;
  music_path: string;
}

// renderer/main間で共有する型定義

export interface OfflineSong {
  id: string;
  user_id: string;
  title: string;
  author: string;
  song_path: string;
  image_path: string | null;
  original_song_path: string | null;
  original_image_path: string | null;
  duration: number | null;
  genre: string | null;
  lyrics: string | null;
  created_at: string | null;
  downloaded_at: Date | null;
}

export interface SongDownloadPayload {
  id: string;
  userId: string;
  title: string;
  author: string;
  song_path: string;
  image_path: string;
  duration?: number;
  genre?: string;
  lyrics?: string;
  video_path?: string;
  created_at: string;
}

// ============================================================================
// 共通型定義
// ============================================================================

/**
 * 同期用の曲型（IPC通信で使用）
 * Song型にオプショナルフィールドを追加
 */
export interface SongForSync {
  id: string;
  title: string;
  author: string;
  song_path: string;
  image_path: string;
  genre?: string;
  count?: string;
  like_count?: string;
  created_at: string;
  user_id?: string;
  video_path?: string;
  duration?: number;
  lyrics?: string;
  is_downloaded?: boolean;
  local_song_path?: string;
  local_image_path?: string;
}

/**
 * 同期用のプレイリスト型
 */
export interface PlaylistForSync {
  id: string;
  title: string;
  image_path?: string;
  is_public: boolean;
  created_at: string;
  user_name?: string;
  user_id?: string;
  createdAt?: string;
}

/**
 * 同期用のスポットライト型
 */
export interface SpotlightForSync {
  id: string;
  video_path: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  thumbnail_path?: string;
  created_at?: string;
}

/**
 * アイコンコンポーネントの型
 * lucide-reactなどのアイコンライブラリと互換性のある型
 */
export type IconComponent = React.ComponentType<{
  size?: string | number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}>;

/**
 * Electron IPC用のメタデータ型
 */
export interface FileMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  track?: number;
  duration?: number;
  picture?: { format: string; data: Buffer }[];
  common?: {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string[];
    year?: number;
    track?: number;
  };
  format?: {
    duration?: number;
    bitrate?: number;
    sampleRate?: number;
  };
}

/**
 * ライブラリファイル情報の型
 */
export interface LibraryFileInfo {
  metadata?: FileMetadata;
  lastModified: number;
  error?: string;
}

/**
 * ライブラリ全体の型
 */
export interface MusicLibrary {
  directoryPath: string;
  files: {
    [filePath: string]: LibraryFileInfo;
  };
}

/**
 * セクションデータのアイテム型（get-section-data用）
 */
export interface SectionItem {
  id: string;
  userId?: string | null;
  title: string;
  author?: string;
  description?: string | null;
  genre?: string | null;
  video_path?: string | null;
  thumbnail_path?: string | null;
  local_video_path?: string | null;
  local_thumbnail_path?: string | null;
  image_path?: string | null;
  is_public?: boolean;
  created_at?: string | null;
  [key: string]: unknown;
}

/**
 * DBのsongsテーブル行の型（mapDbSongToResponse用）
 */
export interface DbSongRow {
  id: string;
  userId?: string | null;
  title: string;
  author: string;
  originalSongPath?: string | null;
  originalImagePath?: string | null;
  originalVideoPath?: string | null;
  songPath?: string | null;
  imagePath?: string | null;
  videoPath?: string | null;
  duration?: number | null;
  genre?: string | null;
  playCount?: number | null;
  likeCount?: number | null;
  lyrics?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
}
