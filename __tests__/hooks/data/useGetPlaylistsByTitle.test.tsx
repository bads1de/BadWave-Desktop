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
import useGetPlaylistsByTitle from "@/hooks/data/useGetPlaylistsByTitle";

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

describe("useGetPlaylistsByTitle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  it("タイトルでプレイリストを検索して取得する", async () => {
    const mockPlaylists = [
      { id: "1", title: "Study Music", is_public: true },
    ];

    const mockIlike = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({ data: mockPlaylists, error: null });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: mockIlike,
      order: mockOrder,
    });

    const { result } = renderHook(() => useGetPlaylistsByTitle("Study"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.playlists).toEqual(mockPlaylists);
    expect(mockIlike).toHaveBeenCalledWith("title", "%Study%");
  });

  it("オフライン時は空の配列を返す", async () => {
    act(() => {
      onlineManager.setOnline(false);
    });

    const { result } = renderHook(() => useGetPlaylistsByTitle("Study"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.playlists).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
