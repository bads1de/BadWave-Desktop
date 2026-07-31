"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/electron/lib/error";
import { createClient } from "@/libs/supabase/client";
import { uploadFileToR2, deleteFileFromR2 } from "@/actions/r2";
import { checkIsAdmin } from "@/actions/checkAdmin";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { ERROR_MESSAGES } from "@/constants/errorMessages";

interface UpdateProfileParams {
  userId: string;
  fullName: string;
}

interface UpdateAvatarParams {
  userId: string;
  avatarFile: File;
  currentAvatarUrl?: string;
}

interface UpdatePasswordParams {
  newPassword: string;
}

interface AccountModalHook {
  onClose: () => void;
}

/**
 * ユーザープロフィールの更新処理を行うカスタムフック
 *
 * @param accountModal アカウントモーダルのフック
 * @returns 更新ミューテーション
 */
const useUpdateUserProfileMutation = (accountModal: AccountModalHook) => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  /**
   * プロフィール情報を更新するミューテーション
   */
  const updateProfile = useMutation({
    mutationFn: async ({ userId, fullName }: UpdateProfileParams) => {
      if (!userId) {
        toast.error(ERROR_MESSAGES.USER_ID_REQUIRED);
        throw new Error(ERROR_MESSAGES.USER_ID_REQUIRED);
      }

      // プロフィール名を更新
      const { error } = await supabaseClient
        .from(TABLES.USERS)
        .update({ full_name: fullName })
        .eq("id", userId);

      if (error) {
        toast.error(getErrorMessage(error));
        throw new Error(getErrorMessage(error));
      }

      return { userId, fullName };
    },
    onSuccess: () => {
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.userDetails] });

      // UIを更新
      router.refresh();
      toast.success("プロフィールを更新しました");

      // モーダルを閉じる
      accountModal.onClose();
    },
    onError: (error: Error) => {
      console.error("Update profile error:", error);
      toast.error(ERROR_MESSAGES.UPDATE_PROFILE_FAILED);
    },
  });

  /**
   * アバター画像を更新するミューテーション
   */
  const updateAvatar = useMutation({
    mutationFn: async ({
      userId,
      avatarFile,
      currentAvatarUrl,
    }: UpdateAvatarParams) => {
      // 管理者権限チェック (アバターのアップロードも管理者に限定)
      const { isAdmin } = await checkIsAdmin();

      if (!isAdmin) {
        toast.error(ERROR_MESSAGES.ADMIN_REQUIRED);
        throw new Error(ERROR_MESSAGES.ADMIN_REQUIRED);
      }

      if (!userId || !avatarFile) {
        toast.error(ERROR_MESSAGES.USER_ID_AND_IMAGE_REQUIRED);
        throw new Error(ERROR_MESSAGES.USER_ID_AND_IMAGE_REQUIRED);
      }

      // 既存のアバター画像がある場合は削除する
      if (currentAvatarUrl) {
        try {
          // 画像のファイルパスを取得
          const filePath = currentAvatarUrl.split("/").pop();

          // R2ストレージから既存画像を削除
          const deleteResult = await deleteFileFromR2("image", filePath!);
          if (!deleteResult.success) {
            console.error("画像の削除に失敗しました", deleteResult.error);
          }
        } catch (error) {
          console.error("画像の削除に失敗しました", error);
          // 削除に失敗しても続行
        }
      }

      // 新しいアバター画像をアップロードする
      const formData = new FormData();
      formData.append("file", avatarFile);
      formData.append("bucketName", "image");
      formData.append("fileNamePrefix", `avatar-${userId}`);

      const result = await uploadFileToR2(formData);

      if (!result.success || !result.url) {
        toast.error(result.error || ERROR_MESSAGES.UPLOAD_FAILED);
        throw new Error(result.error || ERROR_MESSAGES.UPLOAD_FAILED);
      }

      const avatarUrl = result.url;

      // データベースのユーザー情報を更新する
      const { error } = await supabaseClient
        .from(TABLES.USERS)
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (error) {
        toast.error(getErrorMessage(error));
        throw new Error(getErrorMessage(error));
      }

      return { userId, avatarUrl };
    },
    onSuccess: () => {
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.userDetails] });

      // UIを更新
      router.refresh();
      toast.success("アバターを更新しました");
    },
    onError: (error: Error) => {
      console.error("Update avatar error:", error);
      toast.error(getErrorMessage(error, ERROR_MESSAGES.UPDATE_AVATAR_FAILED));
    },
  });

  /**
   * パスワードを更新するミューテーション
   */
  const updatePassword = useMutation({
    mutationFn: async ({ newPassword }: UpdatePasswordParams) => {
      if (!newPassword || newPassword.length < 8) {
        toast.error(ERROR_MESSAGES.PASSWORD_MIN_LENGTH);
        throw new Error(ERROR_MESSAGES.PASSWORD_MIN_LENGTH);
      }

      // Supabaseの認証APIでパスワードを更新
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(getErrorMessage(error));
        throw new Error(getErrorMessage(error));
      }

      return { success: true };
    },
    onSuccess: () => {
      // 成功メッセージを表示
      toast.success("パスワードを更新しました");

      // モーダルを閉じる
      accountModal.onClose();
    },
    onError: (error: Error) => {
      console.error("Update password error:", error);
      toast.error(ERROR_MESSAGES.UPDATE_PASSWORD_FAILED);
    },
  });

  return {
    updateProfile,
    updateAvatar,
    updatePassword,
  };
};

export default useUpdateUserProfileMutation;
