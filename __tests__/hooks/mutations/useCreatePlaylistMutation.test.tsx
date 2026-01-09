/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useCreatePlaylistMutation from "@/hooks/mutations/useCreatePlaylistMutation";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// モック
const mockFrom = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

const mockUserDetails = { id: "user-1", full_name: "Test User" };
jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({ userDetails: mockUserDetails }),
}));

jest.mock("react-hot-toast");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useCreatePlaylistMutation", () => {
  const mockOnClose = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });
  });

  it("プレイリストを正常に作成する", async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreatePlaylistMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ title: "New Playlist" });
    });

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      user_name: "Test User",
      title: "New Playlist",
      is_public: false,
    });
    expect(toast.success).toHaveBeenCalledWith("プレイリストを作成しました");
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("タイトルが空の場合はエラーを投げる", async () => {
    const { result } = renderHook(() => useCreatePlaylistMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ title: "" });
      } catch (e) {
        // Expected
      }
    });

    expect(toast.error).toHaveBeenCalledWith("タイトルを入力してください");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("Supabaseでエラーが発生した場合はトーストを表示する", async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: { message: "Database Error" } });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreatePlaylistMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ title: "Error Playlist" });
      } catch (e) {
        // Expected
      }
    });

    expect(toast.error).toHaveBeenCalledWith("Database Error");
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
