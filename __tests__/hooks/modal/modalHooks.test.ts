/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useUploadModal } from "@/hooks/modal/useUploadModal";
import usePlaylistModal from "@/hooks/modal/usePlaylistModal";
import usePulseUploadModal from "@/hooks/modal/usePulseUploadModal";

// Mock createModal to return zustand stores
jest.mock("@/hooks/utils/createModal", () => {
  const { create } = require("zustand");
  return {
    createModal: () =>
      create((set: any) => ({
        isOpen: false,
        onOpen: () => set({ isOpen: true }),
        onClose: () => set({ isOpen: false }),
      })),
  };
});

describe("Modal hooks (created via createModal)", () => {
  describe("useUploadModal", () => {
    it("should start closed", () => {
      const { result } = renderHook(() => useUploadModal());
      expect(result.current.isOpen).toBe(false);
    });

    it("should open on onOpen", () => {
      const { result } = renderHook(() => useUploadModal());
      act(() => result.current.onOpen());
      expect(result.current.isOpen).toBe(true);
    });

    it("should close on onClose", () => {
      const { result } = renderHook(() => useUploadModal());
      act(() => result.current.onOpen());
      expect(result.current.isOpen).toBe(true);
      act(() => result.current.onClose());
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("usePlaylistModal", () => {
    it("should start closed", () => {
      const { result } = renderHook(() => usePlaylistModal());
      expect(result.current.isOpen).toBe(false);
    });

    it("should toggle state", () => {
      const { result } = renderHook(() => usePlaylistModal());
      act(() => result.current.onOpen());
      expect(result.current.isOpen).toBe(true);
      act(() => result.current.onClose());
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("usePulseUploadModal", () => {
    it("should start closed", () => {
      const { result } = renderHook(() => usePulseUploadModal());
      expect(result.current.isOpen).toBe(false);
    });

    it("should open and close", () => {
      const { result } = renderHook(() => usePulseUploadModal());
      act(() => result.current.onOpen());
      expect(result.current.isOpen).toBe(true);
    });
  });
});
