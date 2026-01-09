/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSyncSpotlight } from "@/hooks/sync/useSyncSpotlight";

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

describe("useSyncSpotlight", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline.mockReturnValue(true);
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("スポットライトを同期し、キャッシュを無効化する", async () => {
    const mockData = [{ id: "1", title: "Spotlight 1" }];
    const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: mockOrder,
    });

    const { result } = renderHook(() => useSyncSpotlight({ autoSync: false }), {
      wrapper: createWrapper(),
    });

    let syncResult;
    await act(async () => {
      syncResult = await result.current.sync();
    });

    expect(syncResult).toEqual({ success: true, count: 1 });
    expect(window.electron.cache.syncSpotlightsMetadata).toHaveBeenCalledWith(mockData);
    expect(window.electron.cache.syncSection).toHaveBeenCalledWith({
      key: "home_spotlight",
      data: mockData,
    });
  });

  it("オフライン時は同期をスキップする", async () => {
    mockIsOnline.mockReturnValue(false);

    const { result } = renderHook(() => useSyncSpotlight({ autoSync: false }), {
      wrapper: createWrapper(),
    });

    let syncResult;
    await act(async () => {
      syncResult = await result.current.sync();
    });

    expect(syncResult).toEqual({ success: false, reason: "conditions_not_met" });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
