import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 検索履歴の最大保存件数 */
export const MAX_HISTORY_SIZE = 20;

interface SearchHistoryState {
  /** 検索履歴（新しい順） */
  history: string[];
}

interface SearchHistoryActions {
  /**
   * 検索キーワードを履歴に追加する
   * - 空文字・空白のみは無視
   * - 前後の空白はトリム
   * - 重複がある場合は先頭に移動
   * - 最大件数を超えた場合は古いものから削除
   * @param query 検索キーワード
   */
  addQuery: (query: string) => void;

  /**
   * 指定したキーワードを履歴から削除する
   * @param query 削除するキーワード
   */
  removeQuery: (query: string) => void;

  /** 履歴を全て削除する */
  clearHistory: () => void;

  /** ハイドレート完了フラグ */
  hasHydrated: boolean;

  /** ハイドレート状態を設定 */
  setHasHydrated: (state: boolean) => void;
}

type SearchHistoryStore = SearchHistoryState & SearchHistoryActions;

/**
 * 検索履歴を管理する Zustand ストア
 *
 * - localStorage で永続化（persist ミドルウェア）
 * - 最大 MAX_HISTORY_SIZE 件まで保存
 * - 新しいキーワードが先頭に追加される
 */
export const useSearchHistoryStore = create<SearchHistoryStore>()(
  persist(
    (set) => ({
      history: [],
      hasHydrated: false,

      addQuery: (query: string) => {
        const trimmed = query.trim();
        if (trimmed.length === 0) return;

        set((state) => {
          // 重複を除去して先頭に追加
          const filtered = state.history.filter((q) => q !== trimmed);
          const newHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY_SIZE);
          return { history: newHistory };
        });
      },

      removeQuery: (query: string) => {
        set((state) => ({
          history: state.history.filter((q) => q !== query),
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
    }),
    {
      name: "badwave-search-history",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export default useSearchHistoryStore;
