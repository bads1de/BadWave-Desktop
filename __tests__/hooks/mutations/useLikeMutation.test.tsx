/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useLikeMutation from "@/hooks/mutations/useLikeMutation";
import toast from "react-hot-toast";

// モック
const mockFrom = jest.fn();
const mockRpc = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

const mockIsOnline = jest.fn().mockReturnValue(true);
jest.mock("@/hooks/utils/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: mockIsOnline() }),
}));

jest.mock("react-hot-toast");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useLikeMutation", () => {
  const songId = "song-1";
  const userId = "user-1";

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline.mockReturnValue(true);
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("いいねを追加する (挿入とRPCが呼ばれること)", async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    const mockRpcCall = jest.fn().mockResolvedValue({ error: null });

    mockFrom.mockReturnValue({
      insert: mockInsert,
    });
    mockRpc.mockReturnValue({
      then: (cb: any) => cb({ error: null }),
    });

    const { result } = renderHook(() => useLikeMutation(songId, userId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(false); // 現在はいいねしていない状態からスタート
    });

    expect(mockInsert).toHaveBeenCalledWith({ song_id: songId, user_id: userId });
    expect(mockRpc).toHaveBeenCalledWith("increment_like_count", {
      song_id: songId,
      increment_value: 1,
    });
    expect(window.electron.cache.addLikedSong).toHaveBeenCalledWith({ userId, songId });
    expect(toast.success).toHaveBeenCalledWith("いいねしました！");
  });

  it("いいねを削除する (削除とRPCが呼ばれること)", async () => {
    const mockDelete = jest.fn().mockReturnThis();
    const mockEq1 = jest.fn().mockReturnThis();
    const mockEq2 = jest.fn().mockResolvedValue({ error: null });

    mockFrom.mockReturnValue({
      delete: mockDelete,
      eq: mockEq1,
    });
    mockEq1.mockReturnValue({ eq: mockEq2 });

    mockRpc.mockReturnValue({
      then: (cb: any) => cb({ error: null }),
    });

    const { result } = renderHook(() => useLikeMutation(songId, userId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(true); // 現在はいいねしている状態からスタート
    });

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq2).toHaveBeenCalledWith("song_id", songId);
    expect(mockRpc).toHaveBeenCalledWith("increment_like_count", {
      song_id: songId,
      increment_value: -1,
    });
    expect(window.electron.cache.removeLikedSong).toHaveBeenCalledWith({ userId, songId });
  });

  it("オフライン時はエラーを投げる", async () => {
    mockIsOnline.mockReturnValue(false);

    const { result } = renderHook(() => useLikeMutation(songId, userId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(false);
      } catch (e) {
        // Expected error
      }
    });

    expect(toast.error).toHaveBeenCalledWith("エラーが発生しました。もう一度お試しください。");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("ローカル曲にはいいねできない", async () => {
    const localSongId = "local_12345";
    const { result } = renderHook(() => useLikeMutation(localSongId, userId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync(false);
      } catch (e) {
        // Expected error
      }
    });

    expect(toast.error).toHaveBeenCalledWith("エラーが発生しました。もう一度お試しください。");
  });
});
