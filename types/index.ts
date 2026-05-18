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
  billing_address?: any;
  payment_method?: any;
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
