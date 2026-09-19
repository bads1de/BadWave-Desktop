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
import { eq, sql, inArray } from "drizzle-orm";
import {
  mapDbSongToResponse,
  mapDbPlaylistToResponse,
  mapDbSpotlightToResponse,
  createUnknownSongFallback,
  normalizeId,
} from "../utils";
import { SectionItem } from "../../types/local";
import { getErrorMessage } from "../lib/error";
import {
  validateInput,
  idSchema,
  songIdSchema,
  sectionQuerySchema,
  paginationSchema,
} from "../lib/ipc-validate";

export function setupQueryHandlers() {
  const db = getDb();

  ipcMain.handle(CHANNELS.GET_CACHED_LIKED_SONGS, async (_, rawUserId: unknown) => {
    try {
      const userId = validateInput(
        idSchema,
        rawUserId,
        CHANNELS.GET_CACHED_LIKED_SONGS,
      );
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

  ipcMain.handle(CHANNELS.GET_CACHED_PLAYLISTS, async (_, rawUserId: unknown) => {
    try {
      const userId = validateInput(
        idSchema,
        rawUserId,
        CHANNELS.GET_CACHED_PLAYLISTS,
      );
      const data = await db.query.playlists.findMany({
        where: eq(playlists.userId, String(userId)),
      });
      return data.map(mapDbPlaylistToResponse);
    } catch (error) {
      console.error("[IPC] get-cached-playlists error:", error);
      return [];
    }
  });

  ipcMain.handle(
    CHANNELS.GET_CACHED_PLAYLIST_SONGS,
    async (_, rawPlaylistId: unknown) => {
      try {
        const playlistId = validateInput(
          idSchema,
          rawPlaylistId,
          CHANNELS.GET_CACHED_PLAYLIST_SONGS,
        );
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
        console.error("[IPC] get-cached-playlist-songs error:", error);
        return [];
      }
    }
  );

  ipcMain.handle(CHANNELS.GET_SECTION_DATA, async (_, rawInput: unknown) => {
    let key = "";
    try {
      const input = validateInput(
        sectionQuerySchema,
        rawInput,
        CHANNELS.GET_SECTION_DATA,
      );
      key = input.key;
      const { type } = input;

      const cache = await db.query.sectionCache.findFirst({
        where: eq(sectionCache.key, key),
      });

      const itemIds = cache?.itemIds;
      if (!itemIds || itemIds.length === 0) {
        return [];
      }

      const idMap = new Map<string, SectionItem>();

      if (type === "spotlights") {
        const rows = await db
          .select()
          .from(spotlights)
          .where(inArray(spotlights.id, itemIds));

        for (const row of rows) {
          idMap.set(row.id, mapDbSpotlightToResponse(row));
        }
      } else if (type === "playlists") {
        const rows = await db
          .select()
          .from(playlists)
          .where(inArray(playlists.id, itemIds));

        for (const row of rows) {
          idMap.set(row.id, mapDbPlaylistToResponse(row));
        }
      } else {
        const rows = await db
          .select()
          .from(songs)
          .where(inArray(songs.id, itemIds));

        for (const row of rows) {
          idMap.set(row.id, mapDbSongToResponse(row));
        }
      }

      return itemIds
        .map((id) => idMap.get(id))
        .filter((item): item is SectionItem => item !== undefined);
    } catch (error) {
      console.error(`[IPC] get-section-data(${key}) error:`, error);
      return [];
    }
  });

  ipcMain.handle(
    CHANNELS.GET_SONGS_PAGINATED,
    async (_, rawInput: unknown) => {
      try {
        const { offset, limit } = validateInput(
          paginationSchema,
          rawInput,
          CHANNELS.GET_SONGS_PAGINATED,
        );
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

  ipcMain.handle(CHANNELS.GET_SONGS_TOTAL_COUNT, async () => {
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

  ipcMain.handle(CHANNELS.DEBUG_DUMP_DB, async () => {
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
    } catch (error: unknown) {
      console.error("[IPC] debug-dump-db error:", error);
      return { error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(CHANNELS.GET_SONG_BY_ID, async (_, rawSongId: unknown) => {
    try {
      const songId = validateInput(
        songIdSchema,
        rawSongId,
        CHANNELS.GET_SONG_BY_ID,
      );
      const normalizedId = normalizeId(songId);
      const song = await db.query.songs.findFirst({
        where: eq(songs.id, normalizedId),
      });

      if (!song) {
        return null;
      }

      return mapDbSongToResponse(song);
    } catch (error) {
      console.error(`[IPC] get-song-by-id error:`, error);
      return null;
    }
  });

  ipcMain.handle(
    CHANNELS.GET_PLAYLIST_BY_ID,
    async (_, rawPlaylistId: unknown) => {
      try {
        const playlistId = validateInput(
          idSchema,
          rawPlaylistId,
          CHANNELS.GET_PLAYLIST_BY_ID,
        );
        const normalizedId = normalizeId(playlistId);
        const playlist = await db.query.playlists.findFirst({
          where: eq(playlists.id, normalizedId),
        });

        if (!playlist) {
          return null;
        }

        return mapDbPlaylistToResponse(playlist);
      } catch (error) {
        console.error(`[IPC] get-playlist-by-id error:`, error);
        return null;
      }
    }
  );
}
