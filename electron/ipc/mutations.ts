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

export function setupMutationHandlers() {
  const db = getDb();

  ipcMain.handle("add-liked-song", async (_, rawInput: unknown) => {
    try {
      const { userId, songId } = validateInput(
        likedSongInputSchema,
        rawInput,
        "add-liked-song",
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
    } catch (error) {
      console.error("[IPC] add-liked-song error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  });

  ipcMain.handle("remove-liked-song", async (_, rawInput: unknown) => {
    try {
      const { userId, songId } = validateInput(
        likedSongInputSchema,
        rawInput,
        "remove-liked-song",
      );
      await db
        .delete(likedSongs)
        .where(
          sql`${likedSongs.userId} = ${String(userId)} AND ${
            likedSongs.songId
          } = ${normalizeId(songId)}`,
        );
      return { success: true };
    } catch (error) {
      console.error("[IPC] remove-liked-song error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  });

  ipcMain.handle("get-like-status", async (_, rawInput: unknown) => {
    try {
      const { userId, songId } = validateInput(
        likedSongInputSchema,
        rawInput,
        "get-like-status",
      );
      const result = await db.query.likedSongs.findFirst({
        where: sql`${likedSongs.userId} = ${String(userId)} AND ${
          likedSongs.songId
        } = ${normalizeId(songId)}`,
      });
      return { isLiked: !!result };
    } catch (error) {
      console.error("[IPC] get-like-status error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { isLiked: false, error: message };
    }
  });

  ipcMain.handle("add-playlist-song", async (_, rawInput: unknown) => {
    try {
      const { playlistId, songId } = validateInput(
        playlistSongInputSchema,
        rawInput,
        "add-playlist-song",
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
    } catch (error) {
      console.error("[IPC] add-playlist-song error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  });

  ipcMain.handle("remove-playlist-song", async (_, rawInput: unknown) => {
    try {
      const { playlistId, songId } = validateInput(
        playlistSongInputSchema,
        rawInput,
        "remove-playlist-song",
      );
      await db
        .delete(playlistSongs)
        .where(
          sql`${playlistSongs.playlistId} = ${normalizeId(playlistId)} AND ${
            playlistSongs.songId
          } = ${normalizeId(songId)}`,
        );
      return { success: true };
    } catch (error) {
      console.error("[IPC] remove-playlist-song error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  });
}
