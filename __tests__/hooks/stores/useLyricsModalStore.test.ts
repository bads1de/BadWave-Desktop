/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import useLyricsModalStore from "@/hooks/stores/useLyricsModalStore";

describe("useLyricsModalStore", () => {
  it("should start with isOpen = false", () => {
    const { result } = renderHook(() => useLyricsModalStore());
    expect(result.current.isOpen).toBe(false);
  });

  it("should open modal when openModal is called", () => {
    const { result } = renderHook(() => useLyricsModalStore());

    act(() => {
      result.current.openModal();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("should close modal when closeModal is called", () => {
    const { result } = renderHook(() => useLyricsModalStore());

    act(() => {
      result.current.openModal();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isOpen).toBe(false);
  });
});
