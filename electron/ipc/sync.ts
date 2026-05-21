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
import { inArray, sql } from "drizzle-orm";

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
  function internalSyncSongs(songsData: any[]) {
    if (songsData.length === 0) return 0;

    const ids = songsData.map((song) => normalizeId(song.id));

    // 1. 既存レコードのdownloaded fieldsをバッチでプリフェッチ
    const existingMap = new Map<
      string,
      {
        songPath: string | null;
        imagePath: string | null;
        videoPath: string | null;
        downloadedAt: Date | null;
      }
    >();

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
    const records = songsData.map((song) => {
      const songId = normalizeId(song.id);
      const existing = existingMap.get(songId);

      return {
        id: songId,
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
    });

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

  ipcMain.handle("sync-songs-metadata", async (_, data: any[]) => {
    try {
      const count = internalSyncSongs(data);
      return { success: true, count };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("sync-playlists", async (_, data: any[]) => {
    try {
      if (data.length === 0) return { success: true, count: 0 };

      const records = data.map((item) => ({
        id: normalizeId(item.id),
        userId: String(item.user_id),
        title: String(item.title),
        imagePath: item.image_path,
        isPublic: Boolean(item.is_public),
        createdAt: item.createdAt || item.created_at,
      }));

      db.insert(playlists)
        .values(records)
        .onConflictDoUpdate({
          target: playlists.id,
          set: {
            title: sql`excluded.title`,
            imagePath: sql`excluded.image_path`,
            isPublic: sql`excluded.is_public`,
          },
        })
        .run();

      return { success: true, count: data.length };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "sync-playlist-songs",
    async (
      _,
      { playlistId, songs: fullSongsData }: { playlistId: string; songs: any[] }
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
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    "sync-liked-songs",
    async (
      _,
      { userId, songs: fullSongsData }: { userId: string; songs: any[] }
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
      } catch (error: any) {
        console.error("[Sync] Liked Songs Error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle("sync-spotlights-metadata", async (_, data: any[]) => {
    try {
      if (data.length === 0) return { success: true, count: 0 };

      // 既存レコードのdownloaded fieldsをバッチでプリフェッチ
      const ids = data.map((item) => normalizeId(item.id));
      const existingMap = new Map<
        string,
        {
          videoPath: string | null;
          thumbnailPath: string | null;
          downloadedAt: Date | null;
        }
      >();

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

      const records = data.map((item) => {
        const id = normalizeId(item.id);
        const existing = existingMap.get(id);

        return {
          id,
          title: String(item.title || "Unknown Title"),
          author: String(item.author || "Unknown Author"),
          description: item.description,
          genre: item.genre,
          originalVideoPath: item.video_path,
          originalThumbnailPath: item.thumbnail_path,
          createdAt: item.created_at,
          videoPath: existing?.videoPath ?? null,
          thumbnailPath: existing?.thumbnailPath ?? null,
          downloadedAt: existing?.downloadedAt ?? null,
        };
      });

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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "sync-section",
    async (_, { key, data }: { key: string; data: any[] }) => {
      try {
        const itemIds = data.map((item) => normalizeId(item.id));

        await db
          .insert(sectionCache)
          .values({
            key,
            itemIds: itemIds as any,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: sectionCache.key,
            set: {
              itemIds: itemIds as any,
              updatedAt: new Date(),
            },
          });

        return { success: true, count: itemIds.length };
      } catch (error: any) {
        console.error(`[Sync] Section ${key} Error:`, error);
        return { success: false, error: error.message };
      }
    }
  );
}
