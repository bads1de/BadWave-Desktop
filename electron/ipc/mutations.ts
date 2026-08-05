import { CHANNELS } from "../channels";
import { ipcMain } from "electron";
import { getDb } from "../db/client";
import { songs, playlists, playlistSongs, likedSongs } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizeId } from "../utils";
import {
  validateInput,
  likedSongInputSchema,
  playlistSongInputSchema,
} from "../lib/ipc-validate";
import { getErrorMessage } from "../lib/error";

export function setupMutationHandlers() {
  const db = getDb();

  ipcMain.handle(CHANNELS.ADD_LIKED_SONG, async (_, rawInput: unknown) => {
    try {
      const { userId, songId } = validateInput(
        likedSongInputSchema,
        rawInput,
        CHANNELS.ADD_LIKED_SONG,
      );
      await db
        .insert(likedSongs)
        .values({
          userId: String(userId),
          songId: normalizeId(songId),
          likedAt: new Date().toISOString(),
        })
        .onConflictDoNothing();
      return { success: true };
    } catch (error: unknown) {
      console.error("[IPC] add-liked-song error:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(CHANNELS.REMOVE_LIKED_SONG, async (_, rawInput: unknown) => {
    try {
      const { userId, songId } = validateInput(
        likedSongInputSchema,
        rawInput,
        CHANNELS.REMOVE_LIKED_SONG,
      );
      await db
        .delete(likedSongs)
        .where(
          sql`${likedSongs.userId} = ${String(userId)} AND ${
            likedSongs.songId
          } = ${normalizeId(songId)}`,
        );
      return { success: true };
    } catch (error: unknown) {
      console.error("[IPC] remove-liked-song error:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(CHANNELS.GET_LIKE_STATUS, async (_, rawInput: unknown) => {
    try {
      const { userId, songId } = validateInput(
        likedSongInputSchema,
        rawInput,
        CHANNELS.GET_LIKE_STATUS,
      );
      const result = await db.query.likedSongs.findFirst({
        where: sql`${likedSongs.userId} = ${String(userId)} AND ${
          likedSongs.songId
        } = ${normalizeId(songId)}`,
      });
      return { isLiked: !!result };
    } catch (error: unknown) {
      console.error("[IPC] get-like-status error:", error);
      return { isLiked: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(CHANNELS.ADD_PLAYLIST_SONG, async (_, rawInput: unknown) => {
    try {
      const { playlistId, songId } = validateInput(
        playlistSongInputSchema,
        rawInput,
        CHANNELS.ADD_PLAYLIST_SONG,
      );
      const psId = `${normalizeId(playlistId)}_${normalizeId(songId)}`;
      await db
        .insert(playlistSongs)
        .values({
          id: psId,
          playlistId: normalizeId(playlistId),
          songId: normalizeId(songId),
          addedAt: new Date().toISOString(),
        })
        .onConflictDoNothing();
      return { success: true };
    } catch (error: unknown) {
      console.error("[IPC] add-playlist-song error:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(CHANNELS.REMOVE_PLAYLIST_SONG, async (_, rawInput: unknown) => {
    try {
      const { playlistId, songId } = validateInput(
        playlistSongInputSchema,
        rawInput,
        CHANNELS.REMOVE_PLAYLIST_SONG,
      );
      await db
        .delete(playlistSongs)
        .where(
          sql`${playlistSongs.playlistId} = ${normalizeId(playlistId)} AND ${
            playlistSongs.songId
          } = ${normalizeId(songId)}`,
        );
      return { success: true };
    } catch (error: unknown) {
      console.error("[IPC] remove-playlist-song error:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });
}
