import { act } from "@testing-library/react";
import useNightCoreStore from "@/hooks/stores/useNightCoreStore";

describe("useNightCoreStore", () => {
  beforeEach(() => {
    act(() => {
      useNightCoreStore.setState({
        isEnabled: false,
      });
    });
  });

  it("should have initial values", () => {
    const state = useNightCoreStore.getState();
    expect(state.isEnabled).toBe(false);
  });

  it("should toggle isEnabled status", () => {
    expect(useNightCoreStore.getState().isEnabled).toBe(false);

    act(() => {
      useNightCoreStore.getState().toggle();
    });
    expect(useNightCoreStore.getState().isEnabled).toBe(true);

    act(() => {
      useNightCoreStore.getState().toggle();
    });
    expect(useNightCoreStore.getState().isEnabled).toBe(false);
  });

  it("should set isEnabled status explicitly", () => {
    expect(useNightCoreStore.getState().isEnabled).toBe(false);

    act(() => {
      useNightCoreStore.getState().setEnabled(true);
    });
    expect(useNightCoreStore.getState().isEnabled).toBe(true);

    act(() => {
      useNightCoreStore.getState().setEnabled(false);
    });
    expect(useNightCoreStore.getState().isEnabled).toBe(false);
  });
});
