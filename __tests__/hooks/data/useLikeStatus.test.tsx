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
import useLikeStatus from "@/hooks/data/useLikeStatus";

// Supabase モック
const mockFrom = jest.fn();
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

describe("useLikeStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
    // デフォルトは Electron 環境 (setup.ts で設定済み)
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  afterEach(() => {
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("Electron環境: ローカルキャッシュからいいね状態を取得する", async () => {
    (window.electron.cache.getLikeStatus as jest.Mock).mockResolvedValue({
      isLiked: true,
    });

    const { result } = renderHook(() => useLikeStatus("song-1", "user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLiked).toBe(true);
    expect(window.electron.cache.getLikeStatus).toHaveBeenCalledWith({
      userId: "user-1",
      songId: "song-1",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("Web環境: Supabaseからいいね状態を取得する (いいね済み)", async () => {
    window.electron.appInfo.isElectron = false;

    const mockMaybeSingle = jest
      .fn()
      .mockResolvedValue({ data: { id: 1 }, error: null });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    });

    const { result } = renderHook(() => useLikeStatus("song-1", "user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLiked).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("liked_songs_regular");
  });

  it("Web環境: Supabaseからいいね状態を取得する (いいねなし)", async () => {
    window.electron.appInfo.isElectron = false;

    const mockMaybeSingle = jest
      .fn()
      .mockResolvedValue({ data: null, error: null });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    });

    const { result } = renderHook(() => useLikeStatus("song-1", "user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLiked).toBe(false);
  });

  it("ユーザーIDがない場合はfalseを返す", async () => {
    const { result } = renderHook(() => useLikeStatus("song-1", undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLiked).toBe(false);
    // enabled: false なのでクエリは走らないが、デフォルト値が返る
  });

  it("ローカルファイル (local_) の場合はクエリを実行しない", async () => {
    const { result } = renderHook(
      () => useLikeStatus("local_12345", "user-1"),
      {
        wrapper: createWrapper(),
      }
    );

    // enabled: false
    expect(result.current.isLiked).toBe(false);
    expect(window.electron.cache.getLikeStatus).not.toHaveBeenCalled();
  });
});
