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
import useGetSongsByGenres from "@/hooks/data/useGetSongGenres";

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

describe("useGetSongsByGenres", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  it("複数のジャンルを指定して曲を取得する", async () => {
    const mockSongs = [
      { id: "1", title: "Pop Song", genre: "Pop" },
      { id: "2", title: "Rock Song", genre: "Rock" },
    ];

    const mockOr = jest.fn().mockReturnThis();
    const mockNeq = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue({ data: mockSongs, error: null });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      or: mockOr,
      neq: mockNeq,
      limit: mockLimit,
    });

    const { result } = renderHook(() => useGetSongsByGenres(["Pop", "Rock"], "exclude-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.songGenres).toEqual(mockSongs);
    expect(mockOr).toHaveBeenCalledWith("genre.ilike.%Pop%,genre.ilike.%Rock%");
    expect(mockNeq).toHaveBeenCalledWith("id", "exclude-1");
  });

  it("ジャンルが空の場合はクエリを実行せずに空配列を返す", async () => {
    const { result } = renderHook(() => useGetSongsByGenres([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.songGenres).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("オフライン時は空の配列を返す", async () => {
    act(() => {
      onlineManager.setOnline(false);
    });

    const { result } = renderHook(() => useGetSongsByGenres(["Pop"]), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.songGenres).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
