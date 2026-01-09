import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";
import { act } from "@testing-library/react";
import { DEFAULT_COLOR_SCHEME_ID } from "@/constants/colorSchemes";

describe("useColorSchemeStore", () => {
  it("should have initial values", () => {
    const state = useColorSchemeStore.getState();
    expect(state.colorSchemeId).toBe(DEFAULT_COLOR_SCHEME_ID);
  });

  it("should update colorSchemeId", () => {
    act(() => {
      useColorSchemeStore.getState().setColorScheme("blue");
    });
    expect(useColorSchemeStore.getState().colorSchemeId).toBe("blue");
  });
});