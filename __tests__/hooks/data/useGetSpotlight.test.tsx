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
import useGetSpotlight from "@/hooks/data/useGetSpotlight";

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

describe("useGetSpotlight", () => {
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
    // クリーンアップ
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("Electron環境: キャッシュからスポットライトを取得する", async () => {
    const mockSpotlights = [
      { id: "1", title: "Spotlight 1", image: "img1.jpg" },
      { id: "2", title: "Spotlight 2", image: "img2.jpg" },
    ];

    (window.electron.cache.getSectionData as jest.Mock).mockResolvedValue(
      mockSpotlights
    );

    const { result } = renderHook(() => useGetSpotlight(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.spotlightData).toEqual(mockSpotlights);
    expect(window.electron.cache.getSectionData).toHaveBeenCalledWith(
      "home_spotlight",
      "spotlights"
    );
    // Supabase は呼ばれないはず
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("Web環境 (オンライン): Supabaseからスポットライトを取得する", async () => {
    // Web環境に切り替え
    window.electron.appInfo.isElectron = false;

    const mockSpotlights = [
      { id: "3", title: "Web Spotlight 1", image: "web1.jpg" },
    ];

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockSpotlights, error: null }),
    });

    const { result } = renderHook(() => useGetSpotlight(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.spotlightData).toEqual(mockSpotlights);
    expect(mockFrom).toHaveBeenCalledWith("spotlights");
  });

  it("Web環境 (オフライン): 取得をスキップする", async () => {
    // Web環境に切り替え
    window.electron.appInfo.isElectron = false;

    // オフラインに設定
    act(() => {
      onlineManager.setOnline(false);
    });

    const { result } = renderHook(() => useGetSpotlight(), {
      wrapper: createWrapper(),
    });

    // isLoading は false になる (queryFn が undefined を返すため、データなしとして解決される)
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // データは空配列 (useQuery のデフォルト値または queryFn が undefined を返した時の処理依存だが、
    // useGetSpotlight の実装では `data: spotlightData = []` となっているので空配列になるはず)
    // ただし queryFn が undefined を返すと data は undefined になるのでデフォルト値が使われる
    expect(result.current.spotlightData).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
