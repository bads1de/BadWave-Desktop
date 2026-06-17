"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Playlist } from "@/types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/electron/lib/error";
import { useUser } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { ERROR_MESSAGES } from "@/constants/errorMessages";

interface CreatePlaylistParams {
  title: string;
}

interface PlaylistModalHook {
  onClose: () => void;
}

/**
 * プレイリストの作成処理を行うカスタムフック
 *
 * @param playlistModal プレイリストモーダルのフック
 * @returns 作成ミューテーション
 */
const useCreatePlaylistMutation = (playlistModal: PlaylistModalHook) => {
  const supabaseClient = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { userDetails: user } = useUser();

  return useMutation({
    mutationFn: async ({ title }: CreatePlaylistParams) => {
      if (!title || !user) {
        toast.error(ERROR_MESSAGES.TITLE_REQUIRED);
        throw new Error(ERROR_MESSAGES.TITLE_REQUIRED);
      }

      // プレイリストを作成
      const { error } = await supabaseClient.from(TABLES.PLAYLISTS).insert({
        user_id: user.id,
        user_name: user.full_name,
        title,
        is_public: false,
      });

      if (error) {
        toast.error(getErrorMessage(error));
        throw new Error(getErrorMessage(error));
      }

      return { title };
    },
    onMutate: async ({ title }) => {
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlists],
      });

      const previousPlaylists = queryClient.getQueryData<Playlist[]>([
        CACHED_QUERIES.playlists,
      ]);

      queryClient.setQueryData<Playlist[]>([CACHED_QUERIES.playlists], (old) => [
        ...(old || []),
        {
          id: `temp_${Date.now()}`,
          title,
          is_public: false,
          user_id: user?.id ?? "",
          user_name: user?.full_name,
          created_at: new Date().toISOString(),
        } as Playlist,
      ]);

      return { previousPlaylists };
    },
    onSuccess: () => {
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });

      // UIを更新
      router.refresh();
      toast.success("プレイリストを作成しました");

      // モーダルを閉じる
      playlistModal.onClose();
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPlaylists) {
        queryClient.setQueryData(
          [CACHED_QUERIES.playlists],
          context.previousPlaylists,
        );
      }
    },
  });
};

export default useCreatePlaylistMutation;
