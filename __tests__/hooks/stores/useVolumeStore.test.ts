import useVolumeStore from "@/hooks/stores/useVolumeStore";
import { act } from "@testing-library/react";

describe("useVolumeStore", () => {
  it("should have initial values", () => {
    const state = useVolumeStore.getState();
    expect(state.volume).toBe(0.5);
  });

  it("should update volume", () => {
    act(() => {
      useVolumeStore.getState().setVolume(0.8);
    });
    expect(useVolumeStore.getState().volume).toBe(0.8);
  });
});