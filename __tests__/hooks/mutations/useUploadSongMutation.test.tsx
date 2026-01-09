/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useUploadSongMutation from "@/hooks/mutations/useUploadSongMutation";
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

describe("useUploadSongMutation", () => {
  const mockOnClose = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });
  });

  it("曲を正常にアップロードする", async () => {
    (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: true });
    (uploadFileToR2 as jest.Mock)
      .mockResolvedValueOnce({ success: true, url: "song-url" }) // song
      .mockResolvedValueOnce({ success: true, url: "image-url" }); // image

    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useUploadSongMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    const songFile = new File([""], "song.mp3", { type: "audio/mpeg" });
    const imageFile = new File([""], "image.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.mutateAsync({
        title: "Test Song",
        author: "Test Artist",
        lyrics: "Lalala",
        genre: ["Pop"],
        songFile,
        imageFile,
      });
    });

    expect(uploadFileToR2).toHaveBeenCalledTimes(2);
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      title: "Test Song",
      author: "Test Artist",
      song_path: "song-url",
      image_path: "image-url",
    }));
    expect(toast.success).toHaveBeenCalledWith("曲をアップロードしました");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("管理者でない場合はエラーを投げる", async () => {
    (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: false });

    const { result } = renderHook(() => useUploadSongMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          title: "Test Song",
          author: "Test Artist",
          lyrics: "",
          genre: [],
          songFile: null,
          imageFile: null,
        });
      } catch (e) {}
    });

    expect(toast.error).toHaveBeenCalledWith("管理者権限が必要です");
    expect(uploadFileToR2).not.toHaveBeenCalled();
  });

  it("アップロードに失敗した場合はエラーを投げる", async () => {
    (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: true });
    (uploadFileToR2 as jest.Mock).mockResolvedValue({ success: false, error: "Upload Failed" });

    const { result } = renderHook(() => useUploadSongMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    const songFile = new File([""], "song.mp3", { type: "audio/mpeg" });
    const imageFile = new File([""], "image.jpg", { type: "image/jpeg" });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          title: "Test Song",
          author: "Test Artist",
          lyrics: "",
          genre: [],
          songFile,
          imageFile,
        });
      } catch (e) {}
    });

    expect(toast.error).toHaveBeenCalledWith("Upload Failed");
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
