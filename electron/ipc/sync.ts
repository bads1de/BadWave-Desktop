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

export function setupSyncHandlers() {
  const db = getDb();

  /**
   * 楽曲メタデータを内部でupsertする
   */
  async function internalSyncSongs(songsData: any[]) {
    let count = 0;
    for (const song of songsData) {
      const songId = normalizeId(song.id);

      const existing = await db.query.songs.findFirst({
        where: (songs, { eq }) => eq(songs.id, songId),
        columns: {
          songPath: true,
          imagePath: true,
          videoPath: true,
          downloadedAt: true,
        },
      });

      const record = {
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

      await db
        .insert(songs)
        .values(record)
        .onConflictDoUpdate({
          target: songs.id,
          set: {
            title: record.title,
            author: record.author,
            originalSongPath: record.originalSongPath,
            originalImagePath: record.originalImagePath,
            originalVideoPath: record.originalVideoPath,
            duration: record.duration,
            genre: record.genre,
            lyrics: record.lyrics,
            playCount: record.playCount,
            likeCount: record.likeCount,
            createdAt: record.createdAt,
          },
        });
      count++;
    }
    return count;
  }

  ipcMain.handle("sync-songs-metadata", async (_, data: any[]) => {
    try {
      const count = await internalSyncSongs(data);
      return { success: true, count };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("sync-playlists", async (_, data: any[]) => {
    try {
      for (const item of data) {
        await db
          .insert(playlists)
          .values({
            id: normalizeId(item.id),
            userId: String(item.user_id),
            title: String(item.title),
            imagePath: item.image_path,
            isPublic: Boolean(item.is_public),
            createdAt: item.createdAt || item.created_at,
          })
          .onConflictDoUpdate({
            target: playlists.id,
            set: {
              title: String(item.title),
              imagePath: item.image_path,
              isPublic: Boolean(item.is_public),
            },
          });
      }
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
        await internalSyncSongs(fullSongsData);
        for (const songData of fullSongsData) {
          const songId = normalizeId(songData.id);
          const psId = `${playlistId}_${songId}`;
          await db
            .insert(playlistSongs)
            .values({
              id: psId,
              playlistId: normalizeId(playlistId),
              songId: songId,
              addedAt: songData.created_at,
            })
            .onConflictDoNothing();
        }
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
        await internalSyncSongs(fullSongsData);
        for (const songData of fullSongsData) {
          await db
            .insert(likedSongs)
            .values({
              userId: String(userId),
              songId: normalizeId(songData.id),
              likedAt: songData.created_at || new Date().toISOString(),
            })
            .onConflictDoNothing();
        }
        return { success: true };
      } catch (error: any) {
        console.error("[Sync] Liked Songs Error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle("sync-spotlights-metadata", async (_, data: any[]) => {
    try {
      let count = 0;
      for (const item of data) {
        const id = normalizeId(item.id);

        const record = {
          id: id,
          title: String(item.title || "Unknown Title"),
          author: String(item.author || "Unknown Author"),
          description: item.description,
          genre: item.genre,
          originalVideoPath: item.video_path,
          originalThumbnailPath: item.thumbnail_path,
          createdAt: item.created_at,
        };

        await db
          .insert(spotlights)
          .values(record)
          .onConflictDoUpdate({
            target: spotlights.id,
            set: {
              title: record.title,
              author: record.author,
              description: record.description,
              genre: record.genre,
              originalVideoPath: record.originalVideoPath,
              originalThumbnailPath: record.originalThumbnailPath,
              createdAt: record.createdAt,
            },
          });
        count++;
      }
      return { success: true, count };
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
