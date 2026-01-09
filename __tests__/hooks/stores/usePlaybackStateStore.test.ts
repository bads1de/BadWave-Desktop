import usePlaybackStateStore from "@/hooks/stores/usePlaybackStateStore";
import { act } from "@testing-library/react";

describe("usePlaybackStateStore", () => {
  beforeEach(() => {
    act(() => {
      usePlaybackStateStore.getState().clearPlaybackState();
    });
  });

  it("should save playback state", () => {
    act(() => {
      usePlaybackStateStore.getState().savePlaybackState("song-1", 100, ["song-1", "song-2"]);
    });

    const state = usePlaybackStateStore.getState();
    expect(state.songId).toBe("song-1");
    expect(state.position).toBe(100);
    expect(state.playlist).toEqual(["song-1", "song-2"]);
  });

  it("should update position", () => {
    act(() => {
      usePlaybackStateStore.getState().savePlaybackState("song-1", 100);
      usePlaybackStateStore.getState().updatePosition(150);
    });

    expect(usePlaybackStateStore.getState().position).toBe(150);
  });

  it("should clear playback state", () => {
    act(() => {
      usePlaybackStateStore.getState().savePlaybackState("song-1", 100);
      usePlaybackStateStore.getState().clearPlaybackState();
    });

    expect(usePlaybackStateStore.getState().songId).toBeNull();
    expect(usePlaybackStateStore.getState().position).toBe(0);
  });
});
