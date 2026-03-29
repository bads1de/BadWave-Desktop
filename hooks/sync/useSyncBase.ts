import { useState, useCallback, useRef, useEffect } from "react";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { electronAPI } from "@/libs/electron/index";
import useLatestRef from "@/hooks/utils/useLatestRef";

export interface SyncBaseResult {
  /** 手動で同期をトリガーする関数 */
  sync: () => Promise<{ success: boolean; reason?: string; count?: number; error?: unknown }>;
  /** 現在同期中かどうか */
  isSyncing: boolean;
}

/**
 * 同期フックのボイラープレートを共通化するベースフック
 *
 * - isOnline / electronAPI チェック
 * - 重複同期の防止 (syncInProgress)
 * - isSyncing 状態管理
 * - オンライン復帰時の自動同期
 *
 * @param syncFn - 実際の同期処理。`{ success, count }` を返すこと。
 * @param options.autoSync - true の場合、マウント時およびオンライン復帰時に自動同期（default: true）
 * @param options.canSync - 同期実行可能条件の追加チェック（例: user?.id が必須の場合）
 */
export function useSyncBase(
  syncFn: () => Promise<{ success: boolean; count?: number }>,
  options?: { autoSync?: boolean; canSync?: () => boolean },
): SyncBaseResult {
  const { autoSync = true, canSync } = options ?? {};
  const { isOnline } = useNetworkStatus();
  const isOnlineRef = useLatestRef(isOnline);
  const canSyncRef = useLatestRef(canSync);

  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);

  const sync = useCallback(async () => {
    if (!isOnlineRef.current || !electronAPI.isElectron()) {
      return { success: false, reason: "conditions_not_met" };
    }

    if (canSyncRef.current && !canSyncRef.current()) {
      return { success: false, reason: "conditions_not_met" };
    }

    if (syncInProgress.current) {
      return { success: false, reason: "already_syncing" };
    }

    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const result = await syncFn();
      return { ...result };
    } catch (error) {
      return { success: false, reason: "error", error };
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [syncFn, isOnlineRef, canSyncRef]);

  // 自動同期: マウント時およびオンライン復帰時
  useEffect(() => {
    if (!autoSync) return;
    if (isOnline) {
      sync();
    }
  }, [autoSync, isOnline, sync]);

  return { sync, isSyncing };
}
