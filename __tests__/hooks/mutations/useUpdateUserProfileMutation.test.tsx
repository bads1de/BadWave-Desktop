/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useUpdateUserProfileMutation from "@/hooks/mutations/useUpdateUserProfileMutation";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { uploadFileToR2, deleteFileFromR2 } from "@/actions/r2";
import { checkIsAdmin } from "@/actions/checkAdmin";

// モック
const mockFrom = jest.fn();
const mockAuthUpdate = jest.fn();
jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
    auth: {
      updateUser: mockAuthUpdate,
    },
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

describe("useUpdateUserProfileMutation", () => {
  const mockOnClose = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });
  });

  describe("updateProfile", () => {
    it("プロフィール名を更新する", async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateUserProfileMutation({ onClose: mockOnClose }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateProfile.mutateAsync({ userId: "user-1", fullName: "New Name" });
      });

      expect(mockUpdate).toHaveBeenCalledWith({ full_name: "New Name" });
      expect(mockEq).toHaveBeenCalledWith("id", "user-1");
      expect(toast.success).toHaveBeenCalledWith("プロフィールを更新しました");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("updateAvatar", () => {
    it("アバター画像を更新する (管理者権限あり)", async () => {
      (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: true });
      (uploadFileToR2 as jest.Mock).mockResolvedValue({ success: true, url: "new-avatar-url" });

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateUserProfileMutation({ onClose: mockOnClose }), {
        wrapper: createWrapper(),
      });

      const avatarFile = new File([""], "avatar.jpg", { type: "image/jpeg" });

      await act(async () => {
        await result.current.updateAvatar.mutateAsync({ userId: "user-1", avatarFile });
      });

      expect(uploadFileToR2).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({ avatar_url: "new-avatar-url" });
      expect(toast.success).toHaveBeenCalledWith("アバターを更新しました");
    });

    it("管理者でない場合はエラーを投げる", async () => {
      (checkIsAdmin as jest.Mock).mockResolvedValue({ isAdmin: false });

      const { result } = renderHook(() => useUpdateUserProfileMutation({ onClose: mockOnClose }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.updateAvatar.mutateAsync({ userId: "user-1", avatarFile: new File([""], "a.jpg") });
        } catch (e) {}
      });

      expect(toast.error).toHaveBeenCalledWith("管理者権限が必要です");
    });
  });

  describe("updatePassword", () => {
    it("パスワードを更新する", async () => {
      mockAuthUpdate.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useUpdateUserProfileMutation({ onClose: mockOnClose }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updatePassword.mutateAsync({ newPassword: "new-password-123" });
      });

      expect(mockAuthUpdate).toHaveBeenCalledWith({ password: "new-password-123" });
      expect(toast.success).toHaveBeenCalledWith("パスワードを更新しました");
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("パスワードが短すぎる場合はエラーを投げる", async () => {
      const { result } = renderHook(() => useUpdateUserProfileMutation({ onClose: mockOnClose }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.updatePassword.mutateAsync({ newPassword: "short" });
        } catch (e) {}
      });

      expect(toast.error).toHaveBeenCalledWith("パスワードは8文字以上で入力してください");
    });
  });
});
