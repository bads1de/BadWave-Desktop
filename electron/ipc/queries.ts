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
import { eq, sql, inArray } from "drizzle-orm";
import { mapDbSongToResponse, createUnknownSongFallback, normalizeId } from "../utils";

export function setupQueryHandlers() {
  const db = getDb();

  ipcMain.handle("get-cached-liked-songs", async (_, userId: string) => {
    try {
      const results = await db
        .select()
        .from(likedSongs)
        .leftJoin(
          songs,
          sql`CAST(${likedSongs.songId} AS TEXT) = CAST(${songs.id} AS TEXT)`
        )
        .where(eq(likedSongs.userId, String(userId)));

      return results.map((row) => {
        const liked_songs = row.liked_songs;
        const song = row.songs;
        if (!song) {
          return createUnknownSongFallback(
            liked_songs.songId,
            liked_songs.userId,
            liked_songs.likedAt,
          );
        }
        return mapDbSongToResponse(song, {
          created_at: liked_songs.likedAt,
          user_id: liked_songs.userId,
        });
      });
    } catch (error) {
      console.error("[IPC] get-cached-liked-songs error:", error);
      return [];
    }
  });

  ipcMain.handle("get-cached-playlists", async (_, userId: string) => {
    try {
      const data = await db.query.playlists.findMany({
        where: eq(playlists.userId, String(userId)),
      });
      return data.map((item) => ({
        id: item.id,
        user_id: item.userId,
        title: item.title,
        image_path: item.imagePath,
        is_public: item.isPublic,
        created_at: item.createdAt,
      }));
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle("get-cached-playlist-songs", async (_, playlistId: string) => {
    try {
      const results = await db
        .select()
        .from(playlistSongs)
        .leftJoin(
          songs,
          sql`CAST(${playlistSongs.songId} AS TEXT) = CAST(${songs.id} AS TEXT)`
        )
        .where(eq(playlistSongs.playlistId, normalizeId(playlistId)));

      return results.map((row) => {
        const playlist_songs = row.playlist_songs;
        const song = row.songs;
        if (!song) {
          return createUnknownSongFallback(
            playlist_songs.songId,
            "",
            playlist_songs.addedAt,
          );
        }
        return mapDbSongToResponse(song, {
          created_at: playlist_songs.addedAt,
        });
      });
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle(
    "get-section-data",
    async (
      _,
      { key, type }: { key: string; type: "songs" | "spotlights" | "playlists" }
    ) => {
      try {
        const cache = await db.query.sectionCache.findFirst({
          where: eq(sectionCache.key, key),
        });

        if (!cache || !cache.itemIds) {
          return [];
        }

        const itemIds = cache.itemIds as unknown as string[];
        if (itemIds.length === 0) return [];

        let results: any[] = [];
        let idMap = new Map<string, any>();

        if (type === "spotlights") {
          results = await db
            .select()
            .from(spotlights)
            .where(inArray(spotlights.id, itemIds));

          results.forEach((item) =>
            idMap.set(item.id, {
              id: item.id,
              title: item.title,
              author: item.author,
              description: item.description,
              genre: item.genre,
              video_path: item.originalVideoPath,
              thumbnail_path: item.originalThumbnailPath,
              local_video_path: item.videoPath || null,
              local_thumbnail_path: item.thumbnailPath || null,
              created_at: item.createdAt,
            })
          );
        } else if (type === "playlists") {
          results = await db
            .select()
            .from(playlists)
            .where(inArray(playlists.id, itemIds));

          results.forEach((p) =>
            idMap.set(p.id, {
              id: p.id,
              user_id: p.userId,
              title: p.title,
              image_path: p.imagePath,
              is_public: !!p.isPublic,
              created_at: p.createdAt,
            })
          );
        } else {
          results = await db
            .select()
            .from(songs)
            .where(inArray(songs.id, itemIds));

          results.forEach((s) =>
            idMap.set(s.id, mapDbSongToResponse(s))
          );
        }

        return itemIds
          .map((id) => idMap.get(id))
          .filter((item) => item !== undefined);
      } catch (error) {
        console.error(`[IPC] get-section-data(${key}) error:`, error);
        return [];
      }
    }
  );

  ipcMain.handle(
    "get-songs-paginated",
    async (_, { offset, limit }: { offset: number; limit: number }) => {
      try {
        const results = await db
          .select()
          .from(songs)
          .orderBy(sql`${songs.createdAt} DESC`)
          .limit(limit)
          .offset(offset);

        return results.map((s) => mapDbSongToResponse(s));
      } catch (error) {
        console.error("[IPC] get-songs-paginated error:", error);
        return [];
      }
    }
  );

  ipcMain.handle("get-songs-total-count", async () => {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(songs);
      return result[0]?.count || 0;
    } catch (error) {
      console.error("[IPC] get-songs-total-count error:", error);
      return 0;
    }
  });

  ipcMain.handle("debug-dump-db", async () => {
    try {
      const liked = await db.select().from(likedSongs).limit(10);
      const allSongs = await db.select().from(songs).limit(10);
      const joined = await db
        .select()
        .from(likedSongs)
        .leftJoin(
          songs,
          sql`CAST(${likedSongs.songId} AS TEXT) = CAST(${songs.id} AS TEXT)`
        )
        .limit(10);
      return { liked, allSongs, joined };
    } catch (error: any) {
      return { error: error.message };
    }
  });

  ipcMain.handle("get-song-by-id", async (_, songId: string) => {
    try {
      const normalizedId = normalizeId(songId);
      const song = await db.query.songs.findFirst({
        where: eq(songs.id, normalizedId),
      });

      if (!song) {
        return null;
      }

      return mapDbSongToResponse(song);
    } catch (error: any) {
      console.error(`[IPC] get-song-by-id(${songId}) error:`, error);
      return null;
    }
  });

  ipcMain.handle("get-playlist-by-id", async (_, playlistId: string) => {
    try {
      const normalizedId = normalizeId(playlistId);
      const playlist = await db.query.playlists.findFirst({
        where: eq(playlists.id, normalizedId),
      });

      if (!playlist) {
        return null;
      }

      return {
        id: playlist.id,
        user_id: playlist.userId,
        title: playlist.title,
        image_path: playlist.imagePath || undefined,
        is_public: !!playlist.isPublic,
        created_at: playlist.createdAt,
      };
    } catch (error: any) {
      console.error(`[IPC] get-playlist-by-id(${playlistId}) error:`, error);
      return null;
    }
  });
}
