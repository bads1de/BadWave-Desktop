/**
 * @jest-environment jsdom
 */
import {
  checkLocalFileExists,
  filterStaleLocalSongs,
} from "@/libs/electron/files";
import { Song } from "@/types";

describe("electron/files", () => {
  const mockIpcInvoke = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).electron = {
      ipc: {
        invoke: mockIpcInvoke,
      },
    };
  });

  describe("checkLocalFileExists", () => {
    it("should return true if file exists", async () => {
      mockIpcInvoke.mockResolvedValue(true);
      const result = await checkLocalFileExists("C:\\Music\\song.mp3");
      expect(result).toBe(true);
      expect(mockIpcInvoke).toHaveBeenCalledWith(
        "check-local-file-exists",
        "C:\\Music\\song.mp3",
      );
    });

    it("should return false if ipc fails", async () => {
      mockIpcInvoke.mockRejectedValue(new Error("error"));
      const result = await checkLocalFileExists("C:\\Music\\song.mp3");
      expect(result).toBe(false);
    });
  });

  describe("filterStaleLocalSongs", () => {
    const mockFileChecker = jest.fn();

    beforeEach(() => {
      mockFileChecker.mockReset();
    });

    it("should keep non-local ids as-is", async () => {
      const ids = ["online-song-1", "online-song-2"];
      const localSongs = new Map<string, Song>();

      const result = await filterStaleLocalSongs(ids, localSongs, mockFileChecker);

      expect(result).toEqual(["online-song-1", "online-song-2"]);
      expect(mockFileChecker).not.toHaveBeenCalled();
    });

    it("should filter out local songs without data in map", async () => {
      const ids = ["local_abc", "online-song-1"];
      const localSongs = new Map<string, Song>();

      const result = await filterStaleLocalSongs(ids, localSongs, mockFileChecker);

      expect(result).toEqual(["online-song-1"]);
    });

    it("should filter out local songs whose files are missing", async () => {
      const song: Song = {
        id: "local_abc",
        title: "Test",
        author: "Artist",
        song_path: "C:\\Music\\missing.mp3",
        image_path: "",
        genre: "pop",
      } as Song;

      const ids = ["local_abc", "online-song-1"];
      const localSongs = new Map<string, Song>([["local_abc", song]]);

      mockFileChecker.mockResolvedValue(false);

      const result = await filterStaleLocalSongs(ids, localSongs, mockFileChecker);

      expect(result).toEqual(["online-song-1"]);
      expect(mockFileChecker).toHaveBeenCalledWith("C:\\Music\\missing.mp3");
    });

    it("should keep local songs whose files exist", async () => {
      const song: Song = {
        id: "local_abc",
        title: "Test",
        author: "Artist",
        song_path: "C:\\Music\\existing.mp3",
        image_path: "",
        genre: "pop",
      } as Song;

      const ids = ["local_abc", "online-song-1"];
      const localSongs = new Map<string, Song>([["local_abc", song]]);

      mockFileChecker.mockResolvedValue(true);

      const result = await filterStaleLocalSongs(ids, localSongs, mockFileChecker);

      expect(result).toEqual(["local_abc", "online-song-1"]);
    });
  });
});
