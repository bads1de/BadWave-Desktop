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
import usePlaylistSongStatus from "@/hooks/data/usePlaylistSongStatus";

// Supabase モック
const mockFrom = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

// User モック
const mockUseUser = jest.fn();
jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => mockUseUser(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("usePlaylistSongStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
    mockUseUser.mockReturnValue({ user: { id: "user-1" } });
  });

  it("プレイリストに含まれる状態を取得する", async () => {
    const playlists = [{ id: "pl-1" }, { id: "pl-2" }];
    const mockData = [{ playlist_id: "pl-1" }]; // pl-1 には含まれている

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    });

    const { result } = renderHook(
      () => usePlaylistSongStatus("song-1", playlists),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isInPlaylist).toEqual({
      "pl-1": true,
      "pl-2": false,
    });
    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
  });

  it("ユーザーIDがない場合、空オブジェクトを返す", async () => {
    mockUseUser.mockReturnValue({ user: null });

    const playlists = [{ id: "pl-1" }];

    const { result } = renderHook(
      () => usePlaylistSongStatus("song-1", playlists),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isInPlaylist).toEqual({});
  });

  it("ローカルファイル (local_) の場合、クエリを実行しない", async () => {
    const playlists = [{ id: "pl-1" }];
    const { result } = renderHook(
      () => usePlaylistSongStatus("local_song", playlists),
      {
        wrapper: createWrapper(),
      }
    );

    // enabled: false
    // デフォルト値 {} が返る
    expect(result.current.isInPlaylist).toEqual({});
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
