/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSyncLatestSongs } from "@/hooks/sync/useSyncLatestSongs";

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

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useSyncLatestSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline.mockReturnValue(true);
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("最新曲を同期する", async () => {
    const mockData = [{ id: "s-1", title: "Latest Song" }];
    
    const mockLimit = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockOrder = jest.fn().mockReturnThis();
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: mockOrder,
      limit: mockLimit,
    });
    mockOrder.mockReturnValue({ limit: mockLimit });

    const { result } = renderHook(() => useSyncLatestSongs(12, { autoSync: false }), {
      wrapper: createWrapper(),
    });

    let syncResult;
    await act(async () => {
      syncResult = await result.current.sync();
    });

    expect(syncResult).toEqual({ success: true, count: 1 });
    expect(window.electron.cache.syncSongsMetadata).toHaveBeenCalledWith(mockData);
    expect(window.electron.cache.syncSection).toHaveBeenCalledWith({
      key: "home_latest_songs",
      data: mockData,
    });
  });
});
