/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSyncPlaylistSongs } from "@/hooks/sync/useSyncPlaylistSongs";

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

describe("useSyncPlaylistSongs", () => {
  const playlistId = "pl-1";

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOnline.mockReturnValue(true);
    if (window.electron) {
      window.electron.appInfo.isElectron = true;
    }
  });

  it("プレイリスト内の曲を同期する", async () => {
    const mockSongsData = [
      { id: "ps-1", songs: { id: "s-1", title: "Song 1" } },
    ];

    const mockOrder = jest.fn().mockResolvedValue({ data: mockSongsData, error: null });
    const mockEq = jest.fn().mockReturnThis();

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: mockEq,
      order: mockOrder,
    });

    const { result } = renderHook(() => useSyncPlaylistSongs(playlistId, { autoSync: false }), {
      wrapper: createWrapper(),
    });

    let syncResult;
    await act(async () => {
      syncResult = await result.current.sync();
    });

    expect(syncResult).toEqual({ success: true, count: 1 });
    expect(mockEq).toHaveBeenCalledWith("playlist_id", playlistId);
    expect(window.electron.cache.syncPlaylistSongs).toHaveBeenCalledWith({
      playlistId,
      songs: [{ id: "s-1", title: "Song 1", songType: "regular" }],
    });
  });
});
