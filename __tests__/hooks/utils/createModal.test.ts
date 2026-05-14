/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { createModal } from "@/hooks/utils/createModal";

describe("createModal", () => {
  it("should create a modal store with isOpen = false", () => {
    const useModal = createModal();
    const { result } = renderHook(() => useModal());
    expect(result.current.isOpen).toBe(false);
  });

  it("should set isOpen to true when onOpen is called", () => {
    const useModal = createModal();
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.onOpen();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("should set isOpen to false when onClose is called", () => {
    const useModal = createModal();
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.onOpen();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onClose();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("should create independent stores for different calls", () => {
    const useModal1 = createModal();
    const useModal2 = createModal();

    const { result: result1 } = renderHook(() => useModal1());
    const { result: result2 } = renderHook(() => useModal2());

    act(() => {
      result1.current.onOpen();
    });

    expect(result1.current.isOpen).toBe(true);
    expect(result2.current.isOpen).toBe(false);
  });
});
