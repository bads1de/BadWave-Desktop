"use client";

import { useEffect, useRef } from "react";
import usePlayer from "@/hooks/player/usePlayer";
import usePlaybackStateStore from "@/hooks/stores/usePlaybackStateStore";
import { filterStaleLocalSongs } from "@/libs/electron/files";

/**
 * 保存された再生状態を復元するプロバイダー
 * アプリ起動時に前回の再生位置から曲を再開できるようにする
 *
 * ローカルファイルは削除・移動されている可能性があるため、
 * 復元時にファイルの存在確認を行い、存在しないものをキューから除外する
 */
const PlaybackStateProvider = ({ children }: { children: React.ReactNode }) => {
  const player = usePlayer();
  const {
    songId: savedSongId,
    playlist: savedPlaylist,
    hasHydrated,
    setIsRestoring,
  } = usePlaybackStateStore();
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    // ハイドレーション完了まで待つ
    if (!hasHydrated) return;

    // 既に復元済みなら何もしない
    if (hasRestoredRef.current) return;

    // 保存された曲IDがあれば復元
    if (savedSongId) {
      // 復元中フラグを設定（自動再生を防止）
      setIsRestoring(true);

      // プレイリストを復元（ローカルファイルの存在確認付き）
      if (savedPlaylist.length > 0) {
        const localSongs = player.localSongs;
        filterStaleLocalSongs(savedPlaylist, localSongs)
          .then((validIds) => {
            player.setIds(validIds);

            // activeId が有効なキューに含まれていない場合は除外
            if (!validIds.includes(savedSongId)) {
              // 有効な曲がない場合は復元しない
              if (validIds.length === 0) {
                player.setId("");
                setIsRestoring(false);
                return;
              }
              // 先頭の曲にフォールバック
              player.setId(validIds[0]);
            } else {
              player.setId(savedSongId);
            }

            hasRestoredRef.current = true;
          })
          .catch(() => {
            // フィルタリングに失敗した場合、元のプレイリストで復元
            player.setIds(savedPlaylist);
            player.setId(savedSongId);
            hasRestoredRef.current = true;
          });
      } else {
        player.setId(savedSongId);
        hasRestoredRef.current = true;
      }
    }
  }, [hasHydrated, savedSongId, savedPlaylist, player, setIsRestoring]);

  return <>{children}</>;
};

export default PlaybackStateProvider;
