/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useMutatePlaylistSong from "@/hooks/mutations/useMutatePlaylistSong";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// モック
const mockFrom = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

const mockUser = { id: "user-1" };
jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({ user: mockUser }),
}));

jest.mock("react-hot-toast");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockIsOnline = jest.fn().mockReturnValue(true);
jest.mock("@/hooks/utils/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: mockIsOnline() }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useMutatePlaylistSong", () => {
  const mockRefresh = jest.fn();
  const songId = "song-1";
  const playlistId = "pl-1";

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });
    mockIsOnline.mockReturnValue(true);
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  describe("addPlaylistSong", () => {
    it("プレイリストに曲を追加する", async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const { result } = renderHook(() => useMutatePlaylistSong(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.addPlaylistSong.mutateAsync({ songId, playlistId });
      });

      expect(mockInsert).toHaveBeenCalledWith({
        playlist_id: playlistId,
        user_id: "user-1",
        song_id: songId,
        song_type: "regular",
      });
      expect(window.electron.cache.addPlaylistSong).toHaveBeenCalledWith({ playlistId, songId });
      expect(toast.success).toHaveBeenCalledWith("プレイリストに曲が追加されました！");
    });

    it("ローカル曲は追加できない", async () => {
      const { result } = renderHook(() => useMutatePlaylistSong(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.addPlaylistSong.mutateAsync({ songId: "local_1", playlistId });
        } catch (e) {}
      });

      expect(toast.error).toHaveBeenCalledWith("ローカル曲はプレイリストに追加できません");
    });
  });

  describe("deletePlaylistSong", () => {
    it("プレイリストから曲を削除する", async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockResolvedValue({ error: null });

      mockFrom.mockReturnValue({ delete: mockDelete });
      mockDelete.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ eq: mockEq3 });

      const { result } = renderHook(() => useMutatePlaylistSong(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deletePlaylistSong.mutateAsync({ songId, playlistId });
      });

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq3).toHaveBeenCalledWith("song_id", songId);
      expect(window.electron.cache.removePlaylistSong).toHaveBeenCalledWith({ playlistId, songId });
      expect(toast.success).toHaveBeenCalledWith("プレイリストから曲が削除されました！");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
