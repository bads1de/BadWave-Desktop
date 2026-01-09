import useLyricsStore from "@/hooks/stores/useLyricsStore";
import { act } from "@testing-library/react";

describe("useLyricsStore", () => {
  it("should have initial values", () => {
    const state = useLyricsStore.getState();
    expect(state.showLyrics).toBe(false);
  });

  it("should toggle showLyrics", () => {
    act(() => {
      useLyricsStore.getState().toggleLyrics();
    });
    expect(useLyricsStore.getState().showLyrics).toBe(true);

    act(() => {
      useLyricsStore.getState().toggleLyrics();
    });
    expect(useLyricsStore.getState().showLyrics).toBe(false);
  });
});