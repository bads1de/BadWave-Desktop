/**
 * @jest-environment jsdom
 */
import { cache } from "@/libs/electron/cache";

describe("libs/electron/cache", () => {
  const mockCache = {
    syncSongsMetadata: jest.fn().mockResolvedValue({ success: true, count: 1 }),
    syncPlaylists: jest.fn().mockResolvedValue({ success: true, count: 1 }),
    syncPlaylistSongs: jest.fn().mockResolvedValue({ success: true, count: 1 }),
    syncLikedSongs: jest.fn().mockResolvedValue({ success: true, count: 1 }),
    getCachedPlaylists: jest.fn().mockResolvedValue([]),
    getCachedLikedSongs: jest.fn().mockResolvedValue([]),
    syncSpotlightsMetadata: jest.fn().mockResolvedValue({ success: true, count: 1 }),
    syncSection: jest.fn().mockResolvedValue({ success: true, count: 1 }),
    getCachedPlaylistSongs: jest.fn().mockResolvedValue([]),
    getSectionData: jest.fn().mockResolvedValue([]),
    addLikedSong: jest.fn().mockResolvedValue({ success: true }),
    removeLikedSong: jest.fn().mockResolvedValue({ success: true }),
    getLikeStatus: jest.fn().mockResolvedValue({ isLiked: true }),
    addPlaylistSong: jest.fn().mockResolvedValue({ success: true }),
    removePlaylistSong: jest.fn().mockResolvedValue({ success: true }),
    getSongById: jest.fn().mockResolvedValue({ id: "1" }),
    getPlaylistById: jest.fn().mockResolvedValue({ id: "1" }),
    getSongsPaginated: jest.fn().mockResolvedValue([]),
    getSongsTotalCount: jest.fn().mockResolvedValue(10),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).electron = {
      ...(window as any).electron,
      cache: mockCache,
    };
  });

  it("should sync songs metadata", async () => {
    await cache.syncSongsMetadata([]);
    expect(mockCache.syncSongsMetadata).toHaveBeenCalled();
  });

  it("should sync playlists", async () => {
    await cache.syncPlaylists([]);
    expect(mockCache.syncPlaylists).toHaveBeenCalled();
  });

  it("should handle non-electron environment", async () => {
    const originalElectron = (window as any).electron;
    delete (window as any).electron;

    const result = await cache.syncSongsMetadata([]);
    expect(result).toEqual({ success: false, count: 0, error: "Not in Electron environment" });

    const playlists = await cache.getCachedPlaylists("user1");
    expect(playlists).toEqual([]);

    (window as any).electron = originalElectron;
  });

  it("should handle IPC errors in electron environment", async () => {
    mockCache.syncSongsMetadata.mockRejectedValueOnce(new Error("IPC Error"));
    
    // 現在のcache.tsの実装ではtry-catchがないため、IPCの戻り値がそのまま返るか
    // エラーが投げられる挙動になります。
    await expect(cache.syncSongsMetadata([])).rejects.toThrow("IPC Error");
  });

  it("should call all other methods correctly", async () => {
    await cache.syncPlaylistSongs({ playlistId: "1", songs: [] });
    expect(mockCache.syncPlaylistSongs).toHaveBeenCalled();

    await cache.syncLikedSongs({ userId: "1", songs: [] });
    expect(mockCache.syncLikedSongs).toHaveBeenCalled();

    await cache.getCachedLikedSongs("1");
    expect(mockCache.getCachedLikedSongs).toHaveBeenCalled();

    await cache.syncSpotlightsMetadata([]);
    expect(mockCache.syncSpotlightsMetadata).toHaveBeenCalled();

    await cache.syncSection({ key: "1", data: [] });
    expect(mockCache.syncSection).toHaveBeenCalled();

    await cache.getCachedPlaylistSongs("1");
    expect(mockCache.getCachedPlaylistSongs).toHaveBeenCalled();

    await cache.getSectionData("1", "songs");
    expect(mockCache.getSectionData).toHaveBeenCalled();

    await cache.addLikedSong({ userId: "1", songId: "1" });
    expect(mockCache.addLikedSong).toHaveBeenCalled();

    await cache.removeLikedSong({ userId: "1", songId: "1" });
    expect(mockCache.removeLikedSong).toHaveBeenCalled();

    await cache.getLikeStatus({ userId: "1", songId: "1" });
    expect(mockCache.getLikeStatus).toHaveBeenCalled();

    await cache.addPlaylistSong({ playlistId: "1", songId: "1" });
    expect(mockCache.addPlaylistSong).toHaveBeenCalled();

    await cache.removePlaylistSong({ playlistId: "1", songId: "1" });
    expect(mockCache.removePlaylistSong).toHaveBeenCalled();

    await cache.getSongById("1");
    expect(mockCache.getSongById).toHaveBeenCalled();

    await cache.getPlaylistById("1");
    expect(mockCache.getPlaylistById).toHaveBeenCalled();

    await cache.getSongsPaginated(0, 10);
    expect(mockCache.getSongsPaginated).toHaveBeenCalled();

    await cache.getSongsTotalCount();
    expect(mockCache.getSongsTotalCount).toHaveBeenCalled();
  });
});
