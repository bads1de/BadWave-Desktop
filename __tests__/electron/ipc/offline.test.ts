import { ipcMain, app } from "electron";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";

const mockDb = {
  query: {
    songs: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
  insert: jest.fn(() => ({
    values: jest.fn(() => ({
      onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
    })),
  })),
  delete: jest.fn(() => ({
    where: jest.fn().mockResolvedValue(undefined),
  })),
};

jest.mock("electron", () => ({
  ipcMain: {
    handle: jest.fn(),
  },
  app: {
    getPath: jest.fn().mockReturnValue("/tmp/badwave"),
  },
}));

jest.mock("fs", () => {
  const actual = jest.requireActual("fs");
  return {
    ...actual,
    promises: {
      mkdir: jest.fn().mockResolvedValue(undefined),
      unlink: jest.fn().mockResolvedValue(undefined),
    },
    existsSync: jest.fn(),
    createWriteStream: jest.fn(),
    unlink: jest.fn(),
  };
});

jest.mock("@/electron/db/client", () => ({
  getDb: jest.fn(() => mockDb),
}));

jest.mock("@/electron/lib/error", () => ({
  getErrorMessage: jest.fn((e) => (e instanceof Error ? e.message : "error")),
}));

jest.mock("@/electron/utils", () => ({
  toLocalPath: jest.fn((p: string) => p.replace("badwave://file/", "")),
}));

describe("electron/ipc/offline", () => {
  let handlers: Record<string, Function> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {};
    (ipcMain.handle as jest.Mock).mockImplementation(
      (channel: string, listener: Function) => {
        handlers[channel] = listener;
      },
    );

    jest.isolateModules(() => {
      const { setupOfflineDownloadHandlers } = require("@/electron/ipc/offline");
      setupOfflineDownloadHandlers();
    });
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = handlers[channel];
    if (!handler) throw new Error(`No handler registered for ${channel}`);
    return handler({}, ...args);
  };

  describe("check-offline-status", () => {
    it("should return isDownloaded=true when record exists", async () => {
      mockDb.query.songs.findFirst.mockResolvedValue({
        songPath: "badwave://file/song.mp3",
        imagePath: "badwave://file/image.jpg",
        videoPath: null,
      });

      const result = await invoke("check-offline-status", "song-1");

      expect(result).toEqual({
        isDownloaded: true,
        localPath: "badwave://file/song.mp3",
        localImagePath: "badwave://file/image.jpg",
        localVideoPath: undefined,
      });
    });

    it("should return isDownloaded=false when no record", async () => {
      mockDb.query.songs.findFirst.mockResolvedValue(null);

      const result = await invoke("check-offline-status", "song-1");

      expect(result).toEqual({ isDownloaded: false });
    });

    it("should return isDownloaded=false on error", async () => {
      mockDb.query.songs.findFirst.mockRejectedValue(new Error("DB error"));

      const result = await invoke("check-offline-status", "song-1");

      expect(result).toEqual({ isDownloaded: false });
    });
  });

  describe("get-offline-songs", () => {
    it("should return mapped offline songs", async () => {
      const dbSongs = [
        {
          id: "song-1",
          userId: "user-1",
          title: "Test Song",
          author: "Artist",
          songPath: "badwave://file/song.mp3",
          imagePath: "badwave://file/image.jpg",
          originalSongPath: "https://example.com/song.mp3",
          originalImagePath: "https://example.com/image.jpg",
          originalVideoPath: null,
          videoPath: null,
          duration: 180,
          genre: "pop",
          lyrics: "test lyrics",
          createdAt: "2024-01-01",
          downloadedAt: new Date("2024-06-01"),
        },
      ];
      mockDb.query.songs.findMany.mockResolvedValue(dbSongs);

      const result = await invoke("get-offline-songs");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "song-1",
        title: "Test Song",
        is_downloaded: true,
        song_path: "badwave://file/song.mp3",
      });
    });

    it("should return empty array on error", async () => {
      mockDb.query.songs.findMany.mockRejectedValue(new Error("DB error"));

      const result = await invoke("get-offline-songs");

      expect(result).toEqual([]);
    });
  });

  describe("delete-offline-song", () => {
    it("should delete song record and files", async () => {
      mockDb.query.songs.findFirst.mockResolvedValue({
        id: "song-1",
        songPath: "badwave://file/song.mp3",
        imagePath: "badwave://file/image.jpg",
        videoPath: null,
      });
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await invoke("delete-offline-song", "song-1");

      expect(result).toEqual({ success: true });
      expect(fs.promises.unlink).toHaveBeenCalledTimes(2);
    });

    it("should return error when song not found", async () => {
      mockDb.query.songs.findFirst.mockResolvedValue(null);

      const result = await invoke("delete-offline-song", "song-1");

      expect(result).toEqual({
        success: false,
        error: "Song not found",
      });
    });

    it("should return error on DB failure", async () => {
      mockDb.query.songs.findFirst.mockRejectedValue(
        new Error("DB error"),
      );

      const result = await invoke("delete-offline-song", "song-1");

      expect(result).toEqual({ success: false, error: "DB error" });
    });
  });
});
