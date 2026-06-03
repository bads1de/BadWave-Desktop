"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/electron/lib/error";
import { uploadFileToR2 } from "@/actions/r2";
import { checkIsAdmin } from "@/actions/checkAdmin";
import { CACHED_QUERIES } from "@/constants";
import { ERROR_MESSAGES } from "@/constants/errorMessages";

interface SpotlightUploadParams {
  title: string;
  author: string;
  genre: string;
  description: string;
  videoFile: File | null;
}

interface SpotlightUploadModalHook {
  onClose: () => void;
}

/**
 * Spotlightへの動画アップロード処理を行うカスタムフック
 *
 * @param spotlightUploadModal アップロードモーダルのフック
 * @returns アップロードミューテーション
 */
const useSpotlightUploadMutation = (
  spotlightUploadModal: SpotlightUploadModalHook
) => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      title,
      author,
      genre,
      description,
      videoFile,
    }: SpotlightUploadParams) => {
      // 管理者権限チェック
      const { isAdmin } = await checkIsAdmin();

      if (!isAdmin) {
        toast.error(ERROR_MESSAGES.ADMIN_REQUIRED);
        throw new Error(ERROR_MESSAGES.ADMIN_REQUIRED);
      }

      if (!videoFile || !user) {
        toast.error(ERROR_MESSAGES.VIDEO_FILE_REQUIRED);
        throw new Error(ERROR_MESSAGES.VIDEO_FILE_REQUIRED);
      }

      // 動画をR2にアップロード
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("bucketName", "spotlight");
      formData.append("fileNamePrefix", "spotlight");

      const result = await uploadFileToR2(formData);

      if (!result.success || !result.url) {
        toast.error(result.error || ERROR_MESSAGES.VIDEO_UPLOAD_FAILED);
        throw new Error(result.error || ERROR_MESSAGES.VIDEO_UPLOAD_FAILED);
      }

      const videoUrl = result.url;

      // データベースにレコードを作成
      const { error } = await supabaseClient.from("spotlights").insert({
        video_path: videoUrl,
        title,
        author,
        genre,
        description,
        user_id: user.id,
      });

      if (error) {
        toast.error(getErrorMessage(error));
        throw new Error(getErrorMessage(error));
      }

      return { title, author };
    },
    onSuccess: () => {
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.spotlight] });

      // UIを更新
      router.refresh();
      toast.success("Spotlightに投稿しました!");

      // モーダルを閉じる
      spotlightUploadModal.onClose();
    },
    onError: (error: Error) => {
      console.error("Spotlight upload error:", error);
      toast.error(getErrorMessage(error, ERROR_MESSAGES.POST_FAILED));
    },
  });
};

export default useSpotlightUploadMutation;
