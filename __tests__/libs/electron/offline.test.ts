/**
 * @jest-environment jsdom
 */
import { offline } from "@/libs/electron/offline";

describe("electron/offline", () => {
  const mockGetSongs = jest.fn().mockResolvedValue([]);
  const mockCheckStatus = jest.fn().mockResolvedValue({ isDownloaded: false });
  const mockDeleteSong = jest.fn().mockResolvedValue({ success: true });
  const mockDownloadSong = jest.fn().mockResolvedValue({ success: true });

  /**
   * Electron ブリッジを設定する。
   * isElectron() は window.electron.appInfo.isElectron を参照するため、
   * appInfo を含めて差し替える必要がある。
   */
  const setupElectronBridge = () => {
    (window as any).electron = {
      appInfo: { isElectron: true },
      offline: {
        getSongs: mockGetSongs,
        checkStatus: mockCheckStatus,
        deleteSong: mockDeleteSong,
        downloadSong: mockDownloadSong,
      },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // 既定はブラウザ環境（Electron ブリッジなし）
    delete (window as any).electron;
  });

  describe("getSongs", () => {
    it("should return songs when in Electron", async () => {
      setupElectronBridge();
      mockGetSongs.mockResolvedValue([{ id: "song-1", title: "Test" }]);

      const result = await offline.getSongs();
      expect(result).toEqual([{ id: "song-1", title: "Test" }]);
    });

    it("should return empty array when not in Electron", async () => {
      const result = await offline.getSongs();
      expect(result).toEqual([]);
    });
  });

  describe("checkStatus", () => {
    it("should return status when in Electron", async () => {
      setupElectronBridge();
      mockCheckStatus.mockResolvedValue({
        isDownloaded: true,
        localPath: "/path/to/song",
      });

      const result = await offline.checkStatus("song-1");
      expect(result).toEqual({ isDownloaded: true, localPath: "/path/to/song" });
    });

    it("should return not downloaded when not in Electron", async () => {
      const result = await offline.checkStatus("song-1");
      expect(result).toEqual({ isDownloaded: false });
    });
  });

  describe("deleteSong", () => {
    it("should return success when in Electron", async () => {
      setupElectronBridge();

      const result = await offline.deleteSong("song-1");
      expect(result).toEqual({ success: true });
    });

    it("should return error when not in Electron", async () => {
      const result = await offline.deleteSong("song-1");
      expect(result).toEqual({
        success: false,
        error: "Not in Electron environment",
      });
    });
  });

  describe("downloadSong", () => {
    const songPayload = {
      id: "song-1",
      userId: "user-1",
      title: "Test",
      author: "Author",
      song_path: "http://example.com/song.mp3",
      image_path: "http://example.com/image.jpg",
      created_at: "2023-01-01",
    };

    it("should return success when in Electron", async () => {
      setupElectronBridge();
      mockDownloadSong.mockResolvedValue({
        success: true,
        localPath: "/path/to/song.mp3",
      });

      const result = await offline.downloadSong(songPayload);
      expect(result).toEqual({ success: true, localPath: "/path/to/song.mp3" });
    });

    it("should return error when not in Electron", async () => {
      const result = await offline.downloadSong(songPayload);
      expect(result).toEqual({
        success: false,
        error: "Not in Electron environment",
      });
    });
  });
});
