/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usePulseUploadMutation from "@/hooks/mutations/usePulseUploadMutation";
import toast from "react-hot-toast";
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

describe("usePulseUploadMutation", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Pulseを正常にアップロードする", async () => {
    (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: true });
    (uploadFileToR2 as jest.Mock).mockResolvedValue({ success: true, url: "pulse-url" });

    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => usePulseUploadMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    const musicFile = new File([""], "pulse.mp3", { type: "audio/mpeg" });

    await act(async () => {
      await result.current.mutateAsync({
        title: "Test Pulse",
        genre: "Lo-fi",
        musicFile,
      });
    });

    expect(uploadFileToR2).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith({
      music_path: "pulse-url",
      title: "Test Pulse",
      genre: "Lo-fi",
    });
    expect(toast.success).toHaveBeenCalledWith("Pulseを投稿しました!");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("タイトルが空の場合はエラーを投げる", async () => {
    (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: true });

    const { result } = renderHook(() => usePulseUploadMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          title: "",
          genre: "Lo-fi",
          musicFile: new File([""], "pulse.mp3"),
        });
      } catch (e) {}
    });

    expect(toast.error).toHaveBeenCalledWith("タイトルを入力してください");
  });

  it("管理者でない場合はエラーを投げる", async () => {
    (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: false });

    const { result } = renderHook(() => usePulseUploadMutation({ onClose: mockOnClose }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          title: "Test",
          genre: "Test",
          musicFile: new File([""], "test.mp3"),
        });
      } catch (e) {}
    });

    expect(toast.error).toHaveBeenCalledWith("管理者権限が必要です");
  });
});
