/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSyncPublicPlaylists } from "@/hooks/sync/useSyncPublicPlaylists";

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

describe("useSyncPublicPlaylists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline.mockReturnValue(true);
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("公開プレイリストを同期する", async () => {
    const mockData = [{ id: "pl-1", title: "Public Playlist" }];
    
    const mockLimit = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockOrder = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
    });

    const { result } = renderHook(() => useSyncPublicPlaylists(6, { autoSync: false }), {
      wrapper: createWrapper(),
    });

    let syncResult;
    await act(async () => {
      syncResult = await result.current.sync();
    });

    expect(syncResult).toEqual({ success: true, count: 1 });
    expect(mockEq).toHaveBeenCalledWith("is_public", true);
    expect(window.electron.cache.syncPlaylists).toHaveBeenCalledWith(mockData);
    expect(window.electron.cache.syncSection).toHaveBeenCalledWith({
      key: "home_public_playlists",
      data: mockData,
    });
  });
});
