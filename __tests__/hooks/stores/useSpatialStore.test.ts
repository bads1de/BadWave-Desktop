import useSpatialStore from "@/hooks/stores/useSpatialStore";
import { act } from "@testing-library/react";

describe("useSpatialStore", () => {
  it("should have initial values", () => {
    const state = useSpatialStore.getState();
    expect(state.isSpatialEnabled).toBe(false);
  });

  it("should toggle isSpatialEnabled", () => {
    act(() => {
      useSpatialStore.getState().toggleSpatialEnabled();
    });
    expect(useSpatialStore.getState().isSpatialEnabled).toBe(true);
  });
});