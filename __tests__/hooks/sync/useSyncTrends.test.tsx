/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSyncTrends } from "@/hooks/sync/useSyncTrends";

// モック
const mockFrom = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

const mockIsOnline = jest.fn().mockReturnValue(true);
jest.mock("@/hooks/utils/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: mockIsOnline() }),
}));

jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({ user: { id: "user-1" } }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useSyncTrends", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline.mockReturnValue(true);
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("トレンド曲を同期する", async () => {
    const mockData = [{ id: "s-1", title: "Trend Song", count: 100 }];
    
    const mockFilter = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue({ data: mockData, error: null });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      filter: mockFilter,
      order: mockOrder,
      limit: mockLimit,
    });

    // モックの戻り値をチェーンできるように設定
    mockOrder.mockReturnValue({ limit: mockLimit });

    const { result } = renderHook(() => useSyncTrends("day", { autoSync: false }), {
      wrapper: createWrapper(),
    });

    let syncResult;
    await act(async () => {
      syncResult = await result.current.sync();
    });

    expect(syncResult).toEqual({ success: true, count: 1 });
    expect(mockFilter).toHaveBeenCalled();
    expect(window.electron.cache.syncSongsMetadata).toHaveBeenCalledWith(mockData);
    expect(window.electron.cache.syncSection).toHaveBeenCalledWith({
      key: "trend_day",
      data: mockData,
    });
  });

  it("期間指定なし(all)の場合はフィルタなしで同期する", async () => {
    const mockData = [{ id: "s-1", title: "Trend All", count: 200 }];
    
    const mockFilter = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue({ data: mockData, error: null });
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      filter: mockFilter,
      order: mockOrder,
      limit: mockLimit,
    });
    mockOrder.mockReturnValue({ limit: mockLimit });

    const { result } = renderHook(() => useSyncTrends("all", { autoSync: false }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.sync();
    });

    expect(mockFilter).not.toHaveBeenCalled();
    expect(mockOrder).toHaveBeenCalled();
  });
});