/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useSpotlightUploadMutation from "@/hooks/mutations/useSpotlightUploadMutation";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { uploadFileToR2 } from "@/actions/r2";
import { checkIsAdmin } from "@/actions/checkAdmin";

// モック
const mockFrom = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

const mockUser = { id: "user-1" };
jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({ user: mockUser }),
}));

jest.mock("react-hot-toast");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/actions/r2", () => ({
  uploadFileToR2: jest.fn(),
}));

jest.mock("@/actions/checkAdmin", () => ({
  checkIsAdmin: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useSpotlightUploadMutation", () => {
  const mockOnClose = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });
  });

  it("Spotlightを正常に投稿する", async () => {
    (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: true });
    (uploadFileToR2 as jest.Mock).mockResolvedValue({ success: true, url: "video-url" });

    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useSpotlightUploadMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    const videoFile = new File([""], "video.mp4", { type: "video/mp4" });

    await act(async () => {
      await result.current.mutateAsync({
        title: "Spotlight Title",
        author: "Artist",
        genre: "Pop",
        description: "Desc",
        videoFile,
      });
    });

    expect(uploadFileToR2).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith({
      video_path: "video-url",
      title: "Spotlight Title",
      author: "Artist",
      genre: "Pop",
      description: "Desc",
      user_id: "user-1",
    });
    expect(toast.success).toHaveBeenCalledWith("Spotlightに投稿しました!");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("動画ファイルがない場合はエラーを投げる", async () => {
    (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: true });

    const { result } = renderHook(() => useSpotlightUploadMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          title: "Title",
          author: "Author",
          genre: "Genre",
          description: "Desc",
          videoFile: null,
        });
      } catch (e) {}
    });

    expect(toast.error).toHaveBeenCalledWith("動画ファイルを選択してください");
  });
});
