/**
 * @jest-environment jsdom
 */
import { filterStaleLocalSongs } from "@/libs/electron/files";

describe("filterStaleLocalSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should keep all streaming song IDs", async () => {
    const ids = ["song-1", "song-2", "song-3"];
    const localSongs = new Map();
    const fileChecker = jest.fn();

    const result = await filterStaleLocalSongs(ids, localSongs, fileChecker);

    expect(result).toEqual(["song-1", "song-2", "song-3"]);
    expect(fileChecker).not.toHaveBeenCalled();
  });

  it("should keep local songs whose files exist", async () => {
    const ids = ["local_aHR0cDovL2V4YW1wbGUuY29tL3NvbmcubXAz", "song-1"];
    const localSongs = new Map([
      ["local_aHR0cDovL2V4YW1wbGUuY29tL3NvbmcubXAz", { id: "local_aHR0cDovL2V4YW1wbGUuY29tL3NvbmcubXAz", song_path: "C:\\Music\\song.mp3" } as any],
    ]);
    const fileChecker = jest.fn().mockResolvedValue(true);

    const result = await filterStaleLocalSongs(ids, localSongs, fileChecker);

    expect(result).toEqual(["local_aHR0cDovL2V4YW1wbGUuY29tL3NvbmcubXAz", "song-1"]);
    expect(fileChecker).toHaveBeenCalledWith("C:\\Music\\song.mp3");
  });

  it("should remove local songs whose files no longer exist", async () => {
    const ids = ["local_cmVtb3ZlZA", "song-1", "local_aHR0cDovL2V4YW1wbGUuY29tL3NvbmcubXAz"];
    const localSongs = new Map([
      ["local_cmVtb3ZlZA", { id: "local_cmVtb3ZlZA", song_path: "C:\\Music\\deleted.mp3" } as any],
      ["local_aHR0cDovL2V4YW1wbGUuY29tL3NvbmcubXAz", { id: "local_aHR0cDovL2V4YW1wbGUuY29tL3NvbmcubXAz", song_path: "C:\\Music\\exists.mp3" } as any],
    ]);
    const fileChecker = jest.fn()
      .mockResolvedValueOnce(false)  // deleted.mp3
      .mockResolvedValueOnce(true);   // exists.mp3

    const result = await filterStaleLocalSongs(ids, localSongs, fileChecker);

    expect(result).toEqual(["song-1", "local_aHR0cDovL2V4YW1wbGUuY29tL3NvbmcubXAz"]);
  });

  it("should handle empty playlist", async () => {
    const fileChecker = jest.fn();
    const result = await filterStaleLocalSongs([], new Map(), fileChecker);
    expect(result).toEqual([]);
  });

  it("should remove local songs not found in localSongs map", async () => {
    const ids = ["local_unknown", "song-1"];
    const localSongs = new Map();
    const fileChecker = jest.fn();

    const result = await filterStaleLocalSongs(ids, localSongs, fileChecker);

    expect(result).toEqual(["song-1"]);
    expect(fileChecker).not.toHaveBeenCalled();
  });
});
