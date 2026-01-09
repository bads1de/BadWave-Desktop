/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSyncPlaylists } from "@/hooks/sync/useSyncPlaylists";

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

describe("useSyncPlaylists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline.mockReturnValue(true);
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("ユーザーのプレイリストを同期する", async () => {
    const mockData = [{ id: "pl-1", title: "My Playlist" }];
    
    const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq = jest.fn().mockReturnThis();
    
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: mockEq,
      order: mockOrder,
    });

    const { result } = renderHook(() => useSyncPlaylists({ autoSync: false }), {
      wrapper: createWrapper(),
    });

    let syncResult;
    await act(async () => {
      syncResult = await result.current.sync();
    });

    expect(syncResult).toEqual({ success: true, count: 1 });
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(window.electron.cache.syncPlaylists).toHaveBeenCalledWith(mockData);
  });
});
