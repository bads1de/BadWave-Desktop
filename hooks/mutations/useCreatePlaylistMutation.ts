"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Playlist } from "@/types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/libs/utils/error";
import { useUser } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import { CACHED_QUERIES, TABLES } from "@/constants";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import {
  applyOptimisticUpdate,
  rollbackOptimisticUpdate,
} from "@/libs/query/optimistic";

interface CreatePlaylistParams {
  title: string;
}

/** プレイリスト一覧のクエリキー */
const PLAYLISTS_QUERY_KEY = [CACHED_QUERIES.playlists] as const;

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
    onMutate: ({ title }) =>
      applyOptimisticUpdate<Playlist[]>(
        queryClient,
        PLAYLISTS_QUERY_KEY,
        (old) => [
          ...(old || []),
          {
            id: `temp_${Date.now()}`,
            title,
            is_public: false,
            user_id: user?.id ?? "",
            user_name: user?.full_name,
            created_at: new Date().toISOString(),
          } as Playlist,
        ]
      ),
    onSuccess: () => {
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });

      // UIを更新
      router.refresh();
      toast.success("プレイリストを作成しました");

      // モーダルを閉じる
      playlistModal.onClose();
    },
    onError: (_error, _variables, context) => {
      rollbackOptimisticUpdate(queryClient, PLAYLISTS_QUERY_KEY, context);
    },
  });
};

export default useCreatePlaylistMutation;
