/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSyncRecommendations } from "@/hooks/sync/useSyncRecommendations";

// モック
const mockRpc = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    rpc: mockRpc,
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

describe("useSyncRecommendations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline.mockReturnValue(true);
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("おすすめ曲を同期する", async () => {
    const mockData = [{ id: "s-1", title: "Recommended Song" }];
    mockRpc.mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useSyncRecommendations(10, { autoSync: false }), {
      wrapper: createWrapper(),
    });

    let syncResult;
    await act(async () => {
      syncResult = await result.current.sync();
    });

    expect(syncResult).toEqual({ success: true, count: 1 });
    expect(mockRpc).toHaveBeenCalledWith("get_recommendations", {
      p_user_id: "user-1",
      p_limit: 10,
    });
    expect(window.electron.cache.syncSongsMetadata).toHaveBeenCalled();
    expect(window.electron.cache.syncSection).toHaveBeenCalled();
  });
});