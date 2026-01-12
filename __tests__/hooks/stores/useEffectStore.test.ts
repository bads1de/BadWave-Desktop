import { act } from "@testing-library/react";
import useEffectStore from "@/hooks/stores/useEffectStore";

describe("useEffectStore", () => {
  beforeEach(() => {
    act(() => {
      useEffectStore.setState({
        isSlowedReverb: false,
        is8DAudioEnabled: false,
        rotationSpeed: "medium",
        isLoFiEnabled: false,
        hasHydrated: false,
      });
    });
  });

  it("should toggle Slowed+Reverb", () => {
    expect(useEffectStore.getState().isSlowedReverb).toBe(false);
    
    act(() => {
      useEffectStore.getState().toggleSlowedReverb();
    });
    expect(useEffectStore.getState().isSlowedReverb).toBe(true);

    act(() => {
      useEffectStore.getState().toggleSlowedReverb();
    });
    expect(useEffectStore.getState().isSlowedReverb).toBe(false);
  });

  it("should toggle 8D Audio and change rotation speed", () => {
    expect(useEffectStore.getState().is8DAudioEnabled).toBe(false);
    expect(useEffectStore.getState().rotationSpeed).toBe("medium");

    act(() => {
      useEffectStore.getState().toggle8DAudio();
    });
    expect(useEffectStore.getState().is8DAudioEnabled).toBe(true);

    act(() => {
      useEffectStore.getState().setRotationSpeed("fast");
    });
    expect(useEffectStore.getState().rotationSpeed).toBe("fast");
  });

  it("should toggle Lo-Fi mode", () => {
    expect(useEffectStore.getState().isLoFiEnabled).toBe(false);

    act(() => {
      useEffectStore.getState().toggleLoFi();
    });
    expect(useEffectStore.getState().isLoFiEnabled).toBe(true);
  });

  it("should handle hydration state", () => {
    expect(useEffectStore.getState().hasHydrated).toBe(false);

    act(() => {
      useEffectStore.getState().setHasHydrated(true);
    });
    expect(useEffectStore.getState().hasHydrated).toBe(true);
  });
});
