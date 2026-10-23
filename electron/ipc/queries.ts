import { CHANNELS } from "../channels";
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
import { handleIpc, handleValidatedIpc } from "../lib/ipc-handler";
import {
  idSchema,
  songIdSchema,
  sectionQuerySchema,
  paginationSchema,
} from "../lib/ipc-validate";
import { getDb } from "../db/client";

export function setupQueryHandlers() {
  const db = getDb();

  handleValidatedIpc(
    CHANNELS.GET_CACHED_LIKED_SONGS,
    idSchema,
    async (userId) => {
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
    },
  );

  handleValidatedIpc(
    CHANNELS.GET_CACHED_PLAYLISTS,
    idSchema,
    async (userId) => {
      const data = await db.query.playlists.findMany({
        where: eq(playlists.userId, String(userId)),
      });
      return data.map(mapDbPlaylistToResponse);
    },
  );

  handleValidatedIpc(
    CHANNELS.GET_CACHED_PLAYLIST_SONGS,
    idSchema,
    async (playlistId) => {
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
    },
  );

  handleValidatedIpc(
    CHANNELS.GET_SECTION_DATA,
    sectionQuerySchema,
    async ({ key, type }) => {
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
    },
  );

  handleValidatedIpc(
    CHANNELS.GET_SONGS_PAGINATED,
    paginationSchema,
    async ({ offset, limit }) => {
      const results = await db
        .select()
        .from(songs)
        .orderBy(sql`${songs.createdAt} DESC`)
        .limit(limit)
        .offset(offset);

      return results.map((s) => mapDbSongToResponse(s));
    },
  );

  handleIpc(CHANNELS.GET_SONGS_TOTAL_COUNT, async () => {
    const result = await db.select({ count: sql<number>`count(*)` }).from(songs);
    return result[0]?.count || 0;
  });

  handleIpc(CHANNELS.DEBUG_DUMP_DB, async () => {
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
  });

  handleValidatedIpc(
    CHANNELS.GET_SONG_BY_ID,
    songIdSchema,
    async (songId) => {
      const normalizedId = normalizeId(songId);
      const song = await db.query.songs.findFirst({
        where: eq(songs.id, normalizedId),
      });

      if (!song) {
        return null;
      }

      return mapDbSongToResponse(song);
    },
  );

  handleValidatedIpc(
    CHANNELS.GET_PLAYLIST_BY_ID,
    idSchema,
    async (playlistId) => {
      const normalizedId = normalizeId(playlistId);
      const playlist = await db.query.playlists.findFirst({
        where: eq(playlists.id, normalizedId),
      });

      if (!playlist) {
        return null;
      }

      return mapDbPlaylistToResponse(playlist);
    },
  );
}
