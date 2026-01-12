/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import useOnPlay from "@/hooks/player/useOnPlay";

// Mocks
const mockPlayer = {
  playSongWithData: jest.fn(),
  setId: jest.fn(),
  setIds: jest.fn(),
  play: jest.fn(),
};

const mockRpc = jest.fn();
const mockSupabase = {
  rpc: mockRpc,
};

const mockRecordPlay = jest.fn();
const mockPlayHistory = {
  recordPlay: mockRecordPlay,
};

const mockIsOnline = { isOnline: true };

// Jest Mocks
jest.mock("@/hooks/player/usePlayer", () => () => mockPlayer);
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => mockSupabase,
}));
jest.mock("@/hooks/player/usePlayHistory", () => () => mockPlayHistory);
jest.mock("@/hooks/utils/useNetworkStatus", () => ({
  useNetworkStatus: () => mockIsOnline,
}));

// Mock Song Data
const mockSongs: any[] = [
  { id: "1", title: "Song 1", author: "Artist 1" },
  { id: "2", title: "Song 2", author: "Artist 2" },
];

describe("useOnPlay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockIsOnline.isOnline = true;
    mockRpc.mockResolvedValue({ error: null });
    mockRecordPlay.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should play a song and record history when online", async () => {
    const { result } = renderHook(() => useOnPlay(mockSongs));
    const onPlay = result.current;

    await act(async () => {
      onPlay("1");
      jest.advanceTimersByTime(1000);
    });

    // プレイヤー操作
    expect(mockPlayer.play).toHaveBeenCalled();
    expect(mockPlayer.playSongWithData).toHaveBeenCalledWith(
      mockSongs[0],
      ["1", "2"]
    );

    // オンライン処理
    expect(mockRpc).toHaveBeenCalledWith("increment_song_play_count", {
      song_id: "1",
    });
    expect(mockRecordPlay).toHaveBeenCalledWith("1");
  });

  it("should not record history when offline", async () => {
    mockIsOnline.isOnline = false;
    const { result } = renderHook(() => useOnPlay(mockSongs));
    const onPlay = result.current;

    await act(async () => {
      onPlay("1");
      jest.advanceTimersByTime(1000);
    });

    // プレイヤー操作は実行される
    expect(mockPlayer.play).toHaveBeenCalled();
    
    // オフライン処理はスキップ
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockRecordPlay).not.toHaveBeenCalled();
  });

  it("should handle song not found in list", async () => {
    const { result } = renderHook(() => useOnPlay(mockSongs));
    const onPlay = result.current;

    await act(async () => {
      onPlay("999"); // 存在しないID
      jest.advanceTimersByTime(1000);
    });

    expect(mockPlayer.setId).toHaveBeenCalledWith("999");
    expect(mockPlayer.setIds).toHaveBeenCalledWith(["1", "2"]);
    expect(mockPlayer.playSongWithData).not.toHaveBeenCalled();
  });

  it("should debounce play calls", async () => {
    const { result } = renderHook(() => useOnPlay(mockSongs));
    const onPlay = result.current;

    await act(async () => {
      onPlay("1");
      onPlay("2");
      jest.advanceTimersByTime(1000);
    });

    // デバウンスにより最後の呼び出しのみが実行される
    expect(mockPlayer.playSongWithData).toHaveBeenCalledTimes(1);
    expect(mockPlayer.playSongWithData).toHaveBeenCalledWith(mockSongs[1], expect.any(Array));
  });
});
