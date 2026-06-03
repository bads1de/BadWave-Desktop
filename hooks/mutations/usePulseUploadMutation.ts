"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import { getErrorMessage } from "@/electron/lib/error";
import { uploadFileToR2 } from "@/actions/r2";
import { checkIsAdmin } from "@/actions/checkAdmin";
import { CACHED_QUERIES } from "@/constants";
import { ERROR_MESSAGES } from "@/constants/errorMessages";

interface PulseUploadParams {
  title: string;
  genre: string;
  musicFile: File | null;
}

interface PulseUploadModalHook {
  onClose: () => void;
}

async function uploadFile(
  file: File,
  bucketName: "pulse",
  fileNamePrefix: string
): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucketName", bucketName);
  formData.append("fileNamePrefix", fileNamePrefix);

  const result = await uploadFileToR2(formData);

  if (!result.success) {
    throw new Error(result.error || "アップロードに失敗しました");
  }

  return result.url || null;
}

const usePulseUploadMutation = (pulseUploadModal: PulseUploadModalHook) => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ title, genre, musicFile }: PulseUploadParams) => {
      const { isAdmin } = await checkIsAdmin();
      if (!isAdmin) {
        toast.error(ERROR_MESSAGES.ADMIN_REQUIRED);
        throw new Error(ERROR_MESSAGES.ADMIN_REQUIRED);
      }

      if (!musicFile || !user) {
        toast.error(ERROR_MESSAGES.AUDIO_FILE_REQUIRED);
        throw new Error(ERROR_MESSAGES.AUDIO_FILE_REQUIRED);
      }

      if (!title.trim()) {
        toast.error(ERROR_MESSAGES.TITLE_REQUIRED);
        throw new Error(ERROR_MESSAGES.TITLE_REQUIRED);
      }

      if (!genre.trim()) {
        toast.error(ERROR_MESSAGES.GENRE_REQUIRED);
        throw new Error(ERROR_MESSAGES.GENRE_REQUIRED);
      }

      let musicUrl: string | null;
      try {
        musicUrl = await uploadFile(musicFile, "pulse", "pulse");
      } catch (error) {
        toast.error(ERROR_MESSAGES.AUDIO_UPLOAD_FAILED);
        throw new Error(ERROR_MESSAGES.AUDIO_UPLOAD_FAILED);
      }

      if (!musicUrl) {
        toast.error(ERROR_MESSAGES.AUDIO_UPLOAD_FAILED);
        throw new Error(ERROR_MESSAGES.AUDIO_UPLOAD_FAILED);
      }

      const { error } = await supabaseClient.from("pulses").insert({
        music_path: musicUrl,
        title,
        genre,
      });

      if (error) {
        toast.error(getErrorMessage(error));
        throw new Error(getErrorMessage(error));
      }

      return { title, genre };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.pulse] });
      toast.success("Pulseを投稿しました!");
      pulseUploadModal.onClose();
    },
    onError: (error: Error) => {
      console.error("Pulse upload error:", error);
    },
  });
};

export default usePulseUploadMutation;
