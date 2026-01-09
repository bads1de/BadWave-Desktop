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
import useGetTopPlayedSongs from "@/hooks/data/useGetTopPlayedSongs";

// Supabase モック
const mockRpc = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    rpc: mockRpc,
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

describe("useGetTopPlayedSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  it("よく再生される曲を取得する", async () => {
    const mockSongs = [
      { id: "1", title: "Top Song", play_count: 50 },
    ];

    mockRpc.mockResolvedValue({ data: mockSongs, error: null });

    const { result } = renderHook(() => useGetTopPlayedSongs("user-1", "week"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.topSongs).toEqual(mockSongs);
    expect(mockRpc).toHaveBeenCalledWith("get_top_songs", {
      p_user_id: "user-1",
      p_period: "week",
    });
  });

  it("オフライン時は空の配列を返す", async () => {
    act(() => {
      onlineManager.setOnline(false);
    });

    const { result } = renderHook(() => useGetTopPlayedSongs("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.topSongs).toEqual([]);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
