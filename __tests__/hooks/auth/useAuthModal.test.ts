import useAuthModal from "@/hooks/auth/useAuthModal";
import { act } from "@testing-library/react";

describe("useAuthModal", () => {
  it("should have initial values", () => {
    const state = useAuthModal.getState();
    expect(state.isOpen).toBe(false);
  });

  it("should toggle isOpen", () => {
    act(() => {
      useAuthModal.getState().onOpen();
    });
    expect(useAuthModal.getState().isOpen).toBe(true);

    act(() => {
      useAuthModal.getState().onClose();
    });
    expect(useAuthModal.getState().isOpen).toBe(false);
  });
});
