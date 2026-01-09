/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useEditSongMutation from "@/hooks/mutations/useEditSongMutation";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { uploadFileToR2, deleteFileFromR2 } from "@/actions/r2";
import { checkIsAdmin } from "@/actions/checkAdmin";
import { Song } from "@/types";

// モック
const mockFrom = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

jest.mock("react-hot-toast");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/actions/r2", () => ({
  uploadFileToR2: jest.fn(),
  deleteFileFromR2: jest.fn(),
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

describe("useEditSongMutation", () => {
  const mockOnClose = jest.fn();
  const mockRefresh = jest.fn();
  const currentSong: Song = {
    id: "song-1",
    title: "Old Title",
    author: "Old Artist",
    image_path: "old-image.jpg",
    song_path: "old-song.mp3",
    user_id: "user-1",
    genre: "Pop",
    duration: 100,
    created_at: "",
    public: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });
  });

  it("曲を正常に編集する (ファイル変更なし)", async () => {
    (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: true });
    
    const mockUpdate = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useEditSongMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "song-1",
        title: "New Title",
        author: "New Artist",
        genre: ["Rock"],
        currentSong,
      });
    });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      title: "New Title",
      author: "New Artist",
      genre: "Rock",
    }));
    expect(uploadFileToR2).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("曲を編集しました");
  });

  it("画像ファイルを変更してアップロードし、古いファイルを削除する", async () => {
    (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: true });
    (uploadFileToR2 as jest.Mock).mockResolvedValue({ success: true, url: "new-image-url" });
    (deleteFileFromR2 as jest.Mock).mockResolvedValue({ success: true });

    const mockUpdate = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useEditSongMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    const newImageFile = new File([""], "new-image.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.mutateAsync({
        id: "song-1",
        title: "New Title",
        author: "New Artist",
        genre: ["Rock"],
        imageFile: newImageFile,
        currentSong,
      });
    });

    expect(uploadFileToR2).toHaveBeenCalled();
    expect(deleteFileFromR2).toHaveBeenCalledWith("image", "old-image.jpg");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      image_path: "new-image-url",
    }));
  });

  it("管理者でない場合はエラーを投げる", async () => {
    (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: false });

    const { result } = renderHook(() => useEditSongMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: "song-1",
          title: "New Title",
          author: "New Artist",
          genre: [],
          currentSong,
        });
      } catch (e) {}
    });

    expect(toast.error).toHaveBeenCalledWith("管理者権限が必要です");
  });
});
