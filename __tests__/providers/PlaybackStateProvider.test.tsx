/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import PlaybackStateProvider from "@/providers/PlaybackStateProvider";
import usePlayer from "@/hooks/player/usePlayer";
import usePlaybackStateStore from "@/hooks/stores/usePlaybackStateStore";

// Mock hooks
jest.mock("@/hooks/player/usePlayer");
jest.mock("@/hooks/stores/usePlaybackStateStore");

describe("PlaybackStateProvider", () => {
  const mockSetIds = jest.fn();
  const mockSetId = jest.fn();
  const mockSetIsRestoring = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (usePlayer as unknown as jest.Mock).mockReturnValue({
      setIds: mockSetIds,
      setId: mockSetId,
    });

    (usePlaybackStateStore as unknown as jest.Mock).mockReturnValue({
      songId: "song-1",
      playlist: ["song-1", "song-2"],
      hasHydrated: true,
      setIsRestoring: mockSetIsRestoring,
    });
  });

  it("should restore playback state when hydrated and songId exists", () => {
    render(
      <PlaybackStateProvider>
        <div>Child</div>
      </PlaybackStateProvider>
    );

    expect(mockSetIsRestoring).toHaveBeenCalledWith(true);
    expect(mockSetIds).toHaveBeenCalledWith(["song-1", "song-2"]);
    expect(mockSetId).toHaveBeenCalledWith("song-1");
  });

  it("should not restore if not hydrated", () => {
    (usePlaybackStateStore as unknown as jest.Mock).mockReturnValue({
      songId: "song-1",
      playlist: ["song-1", "song-2"],
      hasHydrated: false,
      setIsRestoring: mockSetIsRestoring,
    });

    render(
      <PlaybackStateProvider>
        <div>Child</div>
      </PlaybackStateProvider>
    );

    expect(mockSetId).not.toHaveBeenCalled();
  });

  it("should not restore if no saved songId", () => {
    (usePlaybackStateStore as unknown as jest.Mock).mockReturnValue({
      songId: null,
      playlist: [],
      hasHydrated: true,
      setIsRestoring: mockSetIsRestoring,
    });

    render(
      <PlaybackStateProvider>
        <div>Child</div>
      </PlaybackStateProvider>
    );

    expect(mockSetId).not.toHaveBeenCalled();
  });
});
