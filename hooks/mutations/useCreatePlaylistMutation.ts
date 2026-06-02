"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import { CACHED_QUERIES } from "@/constants";

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
        toast.error("タイトルを入力してください");
        throw new Error("タイトルを入力してください");
      }

      // プレイリストを作成
      const { error } = await supabaseClient.from("playlists").insert({
        user_id: user.id,
        user_name: user.full_name,
        title,
        is_public: false,
      });

      if (error) {
        toast.error(error.message);
        throw new Error(error.message);
      }

      return { title };
    },
    onMutate: async ({ title }) => {
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlists],
      });

      const previousPlaylists = queryClient.getQueryData<any[]>([
        CACHED_QUERIES.playlists,
      ]);

      queryClient.setQueryData<any[]>([CACHED_QUERIES.playlists], (old) => [
        ...(old || []),
        {
          id: `temp_${Date.now()}`,
          title,
          is_public: false,
          user_id: user?.id,
          user_name: user?.full_name,
        },
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
