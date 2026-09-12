/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useMiniPlayerSync } from "@/hooks/utils/useMiniPlayerSync";
import { miniPlayer, isElectron } from "@/libs/electron";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";
import { DEFAULT_COLOR_SCHEME_ID } from "@/constants/colorSchemes";

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
    // テーマは永続ストアなのでテストごとに既定（cyberpunk）へ戻す
    useColorSchemeStore.getState().setColorScheme(DEFAULT_COLOR_SCHEME_ID);
  });

  it("should update mini player state when song changes", () => {
    renderHook(() => useMiniPlayerSync({ song: mockSong, isPlaying: true }));

    expect(miniPlayer.updateState).toHaveBeenCalledWith(
      expect.objectContaining({
        song: {
          id: "song-1",
          title: "Test Song",
          author: "Test Author",
          image_path: "",
        },
        isPlaying: true,
      })
    );
  });

  it("should send the app color scheme so the mini player matches the theme", () => {
    renderHook(() => useMiniPlayerSync({ song: mockSong, isPlaying: true }));

    // 既定スキームは cyberpunk（constants/colorSchemes.ts）
    expect(miniPlayer.updateState).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: {
          theme300: "165, 243, 252",
          theme400: "34, 211, 238",
          theme500: "6, 182, 212",
          theme600: "219, 39, 119",
          theme900: "15, 23, 42",
        },
      })
    );
  });

  it("should resend state with the new colors when the color scheme changes", () => {
    renderHook(() => useMiniPlayerSync({ song: mockSong, isPlaying: true }));
    (miniPlayer.updateState as jest.Mock).mockClear();

    act(() => {
      useColorSchemeStore.getState().setColorScheme("emerald");
    });

    expect(miniPlayer.updateState).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: expect.objectContaining({ theme500: "16, 185, 129" }),
      })
    );
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

    expect(miniPlayer.updateState).toHaveBeenCalledWith(
      expect.objectContaining({ song: null, isPlaying: false })
    );
  });

  it("should register request state listener", () => {
    renderHook(() => useMiniPlayerSync({ song: mockSong, isPlaying: true }));

    expect(miniPlayer.onRequestState).toHaveBeenCalledWith(expect.any(Function));
  });
});
