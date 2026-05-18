import { ipcMain } from "electron";
import { getDb } from "../db/client";
import { songs, playlists, playlistSongs, likedSongs } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizeId } from "../utils";

export function setupMutationHandlers() {
  const db = getDb();

  ipcMain.handle(
    "add-liked-song",
    async (_, { userId, songId }: { userId: string; songId: string }) => {
      try {
        await db
          .insert(likedSongs)
          .values({
            userId: String(userId),
            songId: normalizeId(songId),
            likedAt: new Date().toISOString(),
          })
          .onConflictDoNothing();
        return { success: true };
      } catch (error: any) {
        console.error("[IPC] add-liked-song error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    "remove-liked-song",
    async (_, { userId, songId }: { userId: string; songId: string }) => {
      try {
        await db
          .delete(likedSongs)
          .where(
            sql`${likedSongs.userId} = ${String(userId)} AND ${
              likedSongs.songId
            } = ${normalizeId(songId)}`
          );
        return { success: true };
      } catch (error: any) {
        console.error("[IPC] remove-liked-song error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    "get-like-status",
    async (_, { userId, songId }: { userId: string; songId: string }) => {
      try {
        const result = await db.query.likedSongs.findFirst({
          where: sql`${likedSongs.userId} = ${String(userId)} AND ${
            likedSongs.songId
          } = ${normalizeId(songId)}`,
        });
        return { isLiked: !!result };
      } catch (error: any) {
        console.error("[IPC] get-like-status error:", error);
        return { isLiked: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    "add-playlist-song",
    async (
      _,
      { playlistId, songId }: { playlistId: string; songId: string }
    ) => {
      try {
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
      } catch (error: any) {
        console.error("[IPC] add-playlist-song error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    "remove-playlist-song",
    async (
      _,
      { playlistId, songId }: { playlistId: string; songId: string }
    ) => {
      try {
        await db
          .delete(playlistSongs)
          .where(
            sql`${playlistSongs.playlistId} = ${normalizeId(playlistId)} AND ${
              playlistSongs.songId
            } = ${normalizeId(songId)}`
          );
        return { success: true };
      } catch (error: any) {
        console.error("[IPC] remove-playlist-song error:", error);
        return { success: false, error: error.message };
      }
    }
  );
}
