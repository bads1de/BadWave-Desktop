/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useMiniPlayerSync } from "@/hooks/utils/useMiniPlayerSync";
import { miniPlayer, isElectron } from "@/libs/electron";

jest.mock("@/libs/electron", () => ({
  miniPlayer: {
    updateState: jest.fn().mockResolvedValue(undefined),
    onRequestState: jest.fn().mockReturnValue(jest.fn()),
  },
  isElectron: jest.fn().mockReturnValue(true),
}));

describe("useMiniPlayerSync", () => {
  const mockSong = {
    id: "song-1",
    title: "Test Song",
    author: "Test Author",
    image_path: "/test.jpg",
    song_path: "/test.mp3",
    count: "100",
    like_count: "50",
    genre: "Pop",
    created_at: "2023-01-01",
    user_id: "user-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (isElectron as jest.Mock).mockReturnValue(true);
  });

  it("should update mini player state when song changes", () => {
    renderHook(() => useMiniPlayerSync({ song: mockSong, isPlaying: true }));

    expect(miniPlayer.updateState).toHaveBeenCalledWith({
      song: {
        id: "song-1",
        title: "Test Song",
        author: "Test Author",
        image_path: "",
      },
      isPlaying: true,
    });
  });

  it("should update mini player state when isPlaying changes", () => {
    const { rerender } = renderHook(
      ({ song, isPlaying }) => useMiniPlayerSync({ song, isPlaying }),
      { initialProps: { song: mockSong, isPlaying: false } }
    );

    rerender({ song: mockSong, isPlaying: true });

    expect(miniPlayer.updateState).toHaveBeenCalledWith(
      expect.objectContaining({ isPlaying: true })
    );
  });

  it("should not call updateState when not in Electron", () => {
    (isElectron as jest.Mock).mockReturnValue(false);

    renderHook(() => useMiniPlayerSync({ song: mockSong, isPlaying: true }));

    expect(miniPlayer.updateState).not.toHaveBeenCalled();
  });

  it("should send null song when song is null", () => {
    renderHook(() => useMiniPlayerSync({ song: null, isPlaying: false }));

    expect(miniPlayer.updateState).toHaveBeenCalledWith({
      song: null,
      isPlaying: false,
    });
  });

  it("should register request state listener", () => {
    renderHook(() => useMiniPlayerSync({ song: mockSong, isPlaying: true }));

    expect(miniPlayer.onRequestState).toHaveBeenCalledWith(expect.any(Function));
  });
});
