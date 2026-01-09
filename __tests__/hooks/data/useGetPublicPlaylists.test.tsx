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
import useGetPublicPlaylists from "@/hooks/data/useGetPublicPlaylists";

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

describe("useGetPublicPlaylists", () => {
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

  it("Electron環境: ローカルキャッシュからパブリックプレイリストを取得する", async () => {
    const mockPlaylists = [
      { id: "1", name: "Public Playlist 1", is_public: true },
    ];

    (window.electron.cache.getSectionData as jest.Mock).mockResolvedValue(
      mockPlaylists
    );

    const { result } = renderHook(() => useGetPublicPlaylists(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.playlists).toEqual(mockPlaylists);
    expect(window.electron.cache.getSectionData).toHaveBeenCalledWith(
      "home_public_playlists",
      "playlists"
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("Web環境: Supabaseからパブリックプレイリストを取得する", async () => {
    window.electron.appInfo.isElectron = false;

    const mockPlaylists = [
      { id: "2", name: "Web Public Playlist", is_public: true },
    ];

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest
        .fn()
        .mockResolvedValue({ data: mockPlaylists, error: null }),
    });

    const { result } = renderHook(() => useGetPublicPlaylists(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.playlists).toEqual(mockPlaylists);
    expect(mockFrom).toHaveBeenCalledWith("playlists");
  });

  it("Web環境 (オフライン): 取得をスキップする", async () => {
    window.electron.appInfo.isElectron = false;

    act(() => {
      onlineManager.setOnline(false);
    });

    const { result } = renderHook(() => useGetPublicPlaylists(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.playlists).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
