import { renderHook } from "@testing-library/react";
import { useDiscordRpc } from "@/hooks/useDiscordRpc";
import { Song } from "@/types";

// window.discord のモック
const mockSetActivity = jest.fn();
const mockClearActivity = jest.fn();

beforeAll(() => {
  // windowオブジェクトにdiscordをモックとして追加
  Object.defineProperty(window, "discord", {
    value: {
      setActivity: mockSetActivity,
      clearActivity: mockClearActivity,
    },
    writable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useDiscordRpc", () => {
  const mockSong: Song = {
    id: "1",
    title: "Test Song",
    author: "Test Artist",
    song_path: "path/to/song.mp3",
    image_path: "path/to/image.jpg",
    user_id: "user1",
    created_at: new Date().toISOString(),
  };

  it("should clear activity when no song is provided", () => {
    renderHook(() =>
      useDiscordRpc({
        song: undefined,
        isPlaying: false,
      })
    );

    expect(mockClearActivity).toHaveBeenCalledTimes(1);
    expect(mockSetActivity).not.toHaveBeenCalled();
  });

  it("should set activity when song is playing", () => {
    const duration = 180; // 3 minutes
    const currentTime = 0;

    renderHook(() =>
      useDiscordRpc({
        song: mockSong,
        isPlaying: true,
        duration,
        currentTime,
      })
    );

    expect(mockSetActivity).toHaveBeenCalledTimes(1);
    expect(mockSetActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        details: mockSong.title,
        state: `by ${mockSong.author}`,
        smallImageText: "Playing",
        endTimestamp: expect.any(Number),
      })
    );
  });

  it("should set paused activity when song is paused", () => {
    renderHook(() =>
      useDiscordRpc({
        song: mockSong,
        isPlaying: false,
        duration: 180,
        currentTime: 60,
      })
    );

    expect(mockSetActivity).toHaveBeenCalledTimes(1);
    expect(mockSetActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        details: mockSong.title,
        state: `by ${mockSong.author}`,
        smallImageText: "Paused",
        endTimestamp: undefined, // Paused時は終了時間を送らない
      })
    );
  });

  it("should do nothing if window.discord is undefined", () => {
    // window.discord を一時的に削除
    const originalDiscord = window.discord;
    Object.defineProperty(window, "discord", {
      value: undefined,
      writable: true,
    });

    renderHook(() =>
      useDiscordRpc({
        song: mockSong,
        isPlaying: true,
      })
    );

    expect(mockSetActivity).not.toHaveBeenCalled();
    expect(mockClearActivity).not.toHaveBeenCalled();

    // 復元
    Object.defineProperty(window, "discord", {
      value: originalDiscord,
      writable: true,
    });
  });
});
