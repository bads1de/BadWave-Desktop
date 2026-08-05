import { CHANNELS } from "../channels";
import { ipcMain } from "electron";
import { getDb } from "../db/client";
import {
  songs,
  playlists,
  playlistSongs,
  likedSongs,
  sectionCache,
  spotlights,
} from "../db/schema";
import { normalizeId } from "../utils";
import {
  mapSyncPlaylistToRow,
  mapSyncSongToRow,
  mapSyncSpotlightToRow,
  SongDownloadedFields,
  SpotlightDownloadedFields,
} from "../utils/syncMapper";
import { inArray, sql } from "drizzle-orm";
import { getErrorMessage } from "../lib/error";
import type {
  PlaylistForSync,
  SongForSync,
  SpotlightForSync,
} from "../../types";

// SQLiteのバインド変数上限 (SQLITE_MAX_VARIABLE_NUMBER) を考慮したバッチサイズ
// songs: 17カラム → 999 / 17 ≈ 58曲/batch
const BATCH_SIZE = 50;

export function setupSyncHandlers() {
  const db = getDb();

  /**
   * 楽曲メタデータをバルクupsertする
   *
   * 既存レコードを1クエリでプリフェッチし、downloaded fields (songPath, imagePath, videoPath, downloadedAt)
   * を保持したままバルクINSERTする。SQLite変数制限(999)を超えないようバッチ分割する。
   */
  function internalSyncSongs(songsData: SongForSync[]) {
    if (songsData.length === 0) return 0;

    const ids = songsData.map((song) => normalizeId(song.id));

    // 1. 既存レコードのdownloaded fieldsをバッチでプリフェッチ
    const existingMap = new Map<string, SongDownloadedFields>();

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batchIds = ids.slice(i, i + BATCH_SIZE);
      const rows = db
        .select({
          id: songs.id,
          songPath: songs.songPath,
          imagePath: songs.imagePath,
          videoPath: songs.videoPath,
          downloadedAt: songs.downloadedAt,
        })
        .from(songs)
        .where(inArray(songs.id, batchIds))
        .all();

      for (const row of rows) {
        existingMap.set(row.id, row);
      }
    }

    // 2. 全レコードを構築（downloaded fieldsは既存値を保持）
    const records = songsData.map((song) =>
      mapSyncSongToRow(song, existingMap.get(normalizeId(song.id)))
    );

    // 3. バルクUPSERT（バッチ分割して変数制限を回避）
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      db.insert(songs)
        .values(batch)
        .onConflictDoUpdate({
          target: songs.id,
          set: {
            title: sql`excluded.title`,
            author: sql`excluded.author`,
            originalSongPath: sql`excluded.original_song_path`,
            originalImagePath: sql`excluded.original_image_path`,
            originalVideoPath: sql`excluded.original_video_path`,
            duration: sql`excluded.duration`,
            genre: sql`excluded.genre`,
            lyrics: sql`excluded.lyrics`,
            playCount: sql`excluded.play_count`,
            likeCount: sql`excluded.like_count`,
            createdAt: sql`excluded.created_at`,
          },
        })
        .run();
    }

    return songsData.length;
  }

  ipcMain.handle(CHANNELS.SYNC_SONGS_METADATA, async (_, data: SongForSync[]) => {
    try {
      const count = internalSyncSongs(data);
      return { success: true, count };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(CHANNELS.SYNC_PLAYLISTS, async (_, data: PlaylistForSync[]) => {
    try {
      if (data.length === 0) return { success: true, count: 0 };

      const records = data.map(mapSyncPlaylistToRow);

      // SQLiteのバインド変数上限(999)を超えないようバッチ分割してUPSERT
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        db.insert(playlists)
          .values(batch)
          .onConflictDoUpdate({
            target: playlists.id,
            set: {
              title: sql`excluded.title`,
              imagePath: sql`excluded.image_path`,
              isPublic: sql`excluded.is_public`,
            },
          })
          .run();
      }

      return { success: true, count: data.length };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(
    CHANNELS.SYNC_PLAYLIST_SONGS,
    async (
      _,
      { playlistId, songs: fullSongsData }: { playlistId: string; songs: SongForSync[] }
    ) => {
      try {
        db.transaction(() => {
          internalSyncSongs(fullSongsData);

          const joinRecords = fullSongsData.map((songData) => ({
            id: `${playlistId}_${normalizeId(songData.id)}`,
            playlistId: normalizeId(playlistId),
            songId: normalizeId(songData.id),
            addedAt: songData.created_at,
          }));

          db.insert(playlistSongs)
            .values(joinRecords)
            .onConflictDoNothing()
            .run();
        });

        return { success: true };
      } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
      }
    }
  );

  ipcMain.handle(
    CHANNELS.SYNC_LIKED_SONGS,
    async (
      _,
      { userId, songs: fullSongsData }: { userId: string; songs: SongForSync[] }
    ) => {
      try {
        db.transaction(() => {
          internalSyncSongs(fullSongsData);

          const joinRecords = fullSongsData.map((songData) => ({
            userId: String(userId),
            songId: normalizeId(songData.id),
            likedAt: songData.created_at || new Date().toISOString(),
          }));

          db.insert(likedSongs)
            .values(joinRecords)
            .onConflictDoNothing()
            .run();
        });

        return { success: true };
      } catch (error: unknown) {
        console.error("[Sync] Liked Songs Error:", error);
        return { success: false, error: getErrorMessage(error) };
      }
    }
  );

  ipcMain.handle(CHANNELS.SYNC_SPOTLIGHTS_METADATA, async (_, data: SpotlightForSync[]) => {
    try {
      if (data.length === 0) return { success: true, count: 0 };

      // 既存レコードのdownloaded fieldsをバッチでプリフェッチ
      const ids = data.map((item) => normalizeId(item.id));
      const existingMap = new Map<string, SpotlightDownloadedFields>();

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batchIds = ids.slice(i, i + BATCH_SIZE);
        const rows = db
          .select({
            id: spotlights.id,
            videoPath: spotlights.videoPath,
            thumbnailPath: spotlights.thumbnailPath,
            downloadedAt: spotlights.downloadedAt,
          })
          .from(spotlights)
          .where(inArray(spotlights.id, batchIds))
          .all();

        for (const row of rows) {
          existingMap.set(row.id, row);
        }
      }

      const records = data.map((item) =>
        mapSyncSpotlightToRow(item, existingMap.get(normalizeId(item.id)))
      );

      // バッチ分割してバルクUPSERT
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        db.insert(spotlights)
          .values(batch)
          .onConflictDoUpdate({
            target: spotlights.id,
            set: {
              title: sql`excluded.title`,
              author: sql`excluded.author`,
              description: sql`excluded.description`,
              genre: sql`excluded.genre`,
              originalVideoPath: sql`excluded.original_video_path`,
              originalThumbnailPath: sql`excluded.original_thumbnail_path`,
              createdAt: sql`excluded.created_at`,
            },
          })
          .run();
      }

      return { success: true, count: data.length };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(
    CHANNELS.SYNC_SECTION,
    async (_, { key, data }: { key: string; data: { id: string }[] }) => {
      try {
        const itemIds = data.map((item) => normalizeId(item.id));

        await db
          .insert(sectionCache)
          .values({
            key,
            itemIds: itemIds as string[],
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: sectionCache.key,
            set: {
              itemIds: itemIds as string[],
              updatedAt: new Date(),
            },
          });

        return { success: true, count: itemIds.length };
      } catch (error: unknown) {
        console.error(`[Sync] Section ${key} Error:`, error);
        return { success: false, error: getErrorMessage(error) };
      }
    }
  );
}
