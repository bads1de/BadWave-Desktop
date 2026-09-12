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
import useGetSongsByGenre from "@/hooks/data/useGetSongsByGenre";
import { songIdSchema } from "@/electron/lib/ipc-validate";
import { CACHED_QUERIES } from "@/constants";
import { Song } from "@/types";

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

describe("useGetSongsByGenre", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  it("単一のジャンルで曲を検索する", async () => {
    const mockSongs = [{ id: "1", title: "Rock Song", genre: "Rock" }];
    const mockOr = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({ data: mockSongs, error: null });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      or: mockOr,
      order: mockOrder,
    });

    const { result } = renderHook(() => useGetSongsByGenre("Rock"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.songs).toEqual(mockSongs);
    expect(mockOr).toHaveBeenCalledWith("genre.ilike.%Rock%");
  });

  it("複数のジャンルで曲を検索する", async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    renderHook(() => useGetSongsByGenre(["Rock", "Pop"]), {
      wrapper: createWrapper(),
    });

    expect(mockFrom().or).toHaveBeenCalledWith("genre.ilike.%Rock%,genre.ilike.%Pop%");
  });

  it("ジャンルが空の場合はクエリを実行しない", () => {
    const { result } = renderHook(() => useGetSongsByGenre([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.songs).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("Supabaseが数値IDを返しても、IPC検証を通る文字列IDに揃える", async () => {
    // songs.id は Supabase では JSON の number として返る
    const mockSongs = [
      { id: 104, title: "Scroll Back", genre: "Retro Wave" },
      { id: 93, title: "Beyond Recall", genre: "Retro Wave" },
    ];

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockSongs, error: null }),
    });

    const { result } = renderHook(() => useGetSongsByGenre("Retro Wave"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.songs.map((song) => song.id)).toEqual(["104", "93"]);
    result.current.songs.forEach((song) => {
      // 数値のままだと check-offline-status などが "Invalid input" で失敗する
      expect(songIdSchema.safeParse(song.id).success).toBe(true);
    });
  });

  it("修正前に保存されたキャッシュ（数値ID）でも文字列IDで返す", async () => {
    // staleTime を無限にしてキャッシュからの描画を強制する
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(
      [CACHED_QUERIES.songsByGenres, "Retro Wave"],
      [{ id: 104, title: "Scroll Back", genre: "Retro Wave" }] as unknown as Song[]
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useGetSongsByGenre("Retro Wave"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFrom).not.toHaveBeenCalled(); // 再取得せずキャッシュから描画
    expect(result.current.songs.map((song) => song.id)).toEqual(["104"]);
    expect(songIdSchema.safeParse(result.current.songs[0].id).success).toBe(
      true
    );
  });
});
