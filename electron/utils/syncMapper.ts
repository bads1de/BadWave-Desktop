import {
  PlaylistInsertRow,
  SongInsertRow,
  SpotlightInsertRow,
} from "../db/schema";
import { normalizeId } from "./index";
import type {
  PlaylistForSync,
  SongForSync,
  SpotlightForSync,
} from "../../types";

/**
 * 既存レコードのダウンロード済みフィールド (sync 時に保持する)
 */
export interface SongDownloadedFields {
  songPath: string | null;
  imagePath: string | null;
  videoPath: string | null;
  downloadedAt: Date | null;
}

/**
 * 既存レコードのダウンロード済みフィールド (スポットライト用)
 */
export interface SpotlightDownloadedFields {
  videoPath: string | null;
  thumbnailPath: string | null;
  downloadedAt: Date | null;
}

/**
 * Supabase の曲データを SQLite の挿入行に変換する。
 * 既存レコードのダウンロード済みフィールド (local paths, downloadedAt) は保持する。
 *
 * sync.ts に手書きされていたマッピングを共通化。
 */
export function mapSyncSongToRow(
  song: SongForSync,
  existing?: SongDownloadedFields | null,
): SongInsertRow {
  return {
    id: normalizeId(song.id),
    userId: String(song.user_id || ""),
    title: String(song.title || "Unknown Title"),
    author: String(song.author || "Unknown Author"),
    songPath: existing?.songPath ?? null,
    imagePath: existing?.imagePath ?? null,
    videoPath: existing?.videoPath ?? null,
    originalSongPath: song.song_path,
    originalImagePath: song.image_path,
    originalVideoPath: song.video_path,
    duration: song.duration ? Number(song.duration) : null,
    genre: song.genre,
    lyrics: song.lyrics,
    playCount: song.count ? Number(song.count) : 0,
    likeCount: song.like_count ? Number(song.like_count) : 0,
    createdAt: song.created_at,
    downloadedAt: existing?.downloadedAt ?? null,
  };
}

/**
 * Supabase のプレイリストデータを SQLite の挿入行に変換する。
 */
export function mapSyncPlaylistToRow(
  playlist: PlaylistForSync,
): PlaylistInsertRow {
  return {
    id: normalizeId(playlist.id),
    userId: String(playlist.user_id || ""),
    title: String(playlist.title),
    imagePath: playlist.image_path,
    isPublic: Boolean(playlist.is_public),
    createdAt: playlist.createdAt || playlist.created_at,
  };
}

/**
 * Supabase のスポットライトデータを SQLite の挿入行に変換する。
 * 既存レコードのダウンロード済みフィールド (local paths, downloadedAt) は保持する。
 */
export function mapSyncSpotlightToRow(
  spot: SpotlightForSync,
  existing?: SpotlightDownloadedFields | null,
): SpotlightInsertRow {
  return {
    id: normalizeId(spot.id),
    title: String(spot.title || "Unknown Title"),
    author: String(spot.author || "Unknown Author"),
    description: spot.description,
    genre: spot.genre,
    originalVideoPath: spot.video_path,
    originalThumbnailPath: spot.thumbnail_path,
    createdAt: spot.created_at,
    videoPath: existing?.videoPath ?? null,
    thumbnailPath: existing?.thumbnailPath ?? null,
    downloadedAt: existing?.downloadedAt ?? null,
  };
}
