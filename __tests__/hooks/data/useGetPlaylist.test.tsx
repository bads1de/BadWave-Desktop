/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import useGetPlaylist from "@/hooks/data/useGetPlaylist";
import { electronAPI } from "@/libs/electron/index";

// モック
jest.mock("@/libs/electron/index", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    cache: {
      getPlaylistById: jest.fn(),
    },
  },
  isNetworkError: jest.fn().mockReturnValue(false),
}));

const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGetPlaylist", () => {
  const mockIsElectron = electronAPI.isElectron as jest.Mock;
  const mockGetPlaylistById = electronAPI.cache.getPlaylistById as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  it("should return undefined if no playlistId provided", async () => {
    const { result } = renderHook(() => useGetPlaylist(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.playlist).toBeUndefined();
  });

  describe("Electron環境", () => {
    beforeEach(() => {
      mockIsElectron.mockReturnValue(true);
    });

    it("should fetch from local DB first", async () => {
      const mockPlaylist = { id: "p1", title: "Local Playlist" };
      mockGetPlaylistById.mockResolvedValue(mockPlaylist);

      const { result } = renderHook(() => useGetPlaylist("p1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.playlist).toEqual(mockPlaylist);
      expect(mockGetPlaylistById).toHaveBeenCalledWith("p1");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should fallback to Supabase if local fetch fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockGetPlaylistById.mockRejectedValue(new Error("Local error"));
      const mockPlaylist = { id: "p1", title: "Remote Playlist" };
      mockSingle.mockResolvedValue({ data: mockPlaylist, error: null });

      const { result } = renderHook(() => useGetPlaylist("p1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.playlist).toEqual(mockPlaylist);
      expect(mockFrom).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Web環境", () => {
    beforeEach(() => {
      mockIsElectron.mockReturnValue(false);
    });

    it("should fetch from Supabase", async () => {
      const mockPlaylist = { id: "p1", title: "Remote Playlist" };
      mockSingle.mockResolvedValue({ data: mockPlaylist, error: null });

      const { result } = renderHook(() => useGetPlaylist("p1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.playlist).toEqual(mockPlaylist);
      expect(mockGetPlaylistById).not.toHaveBeenCalled();
    });

    it("should handle Supabase error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockSingle.mockResolvedValue({
        data: { id: "p1", title: "Remote Playlist" },
        error: { message: "Error" },
      });

      const { result } = renderHook(() => useGetPlaylist("p1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      consoleSpy.mockRestore();
    });

    it("Supabaseが数値IDを返しても文字列IDで返す", async () => {
      // playlists.id は数値カラムのため JSON では number で返る
      // （数値のままだと詳細画面の playlistId.slice() でクラッシュする）
      mockSingle.mockResolvedValue({
        data: { id: 73, title: "playlist1", user_id: "user-1" },
        error: null,
      });

      const { result } = renderHook(() => useGetPlaylist("73"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.playlist?.id).toBe("73");
      expect(() =>
        String(result.current.playlist?.id).slice(0, 8).toUpperCase()
      ).not.toThrow();
    });
  });
});
