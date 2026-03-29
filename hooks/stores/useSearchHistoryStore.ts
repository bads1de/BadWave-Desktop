import { createPersistedStore } from "@/hooks/utils/createPersistedStore";

export const MAX_HISTORY_SIZE = 20;

interface SearchHistoryState {
  history: string[];
}

interface SearchHistoryActions {
  addQuery: (query: string) => void;
  removeQuery: (query: string) => void;
  clearHistory: () => void;
}

type SearchHistoryStore = SearchHistoryState & SearchHistoryActions;

/**
 * 検索履歴を管理する Zustand ストア
 *
 * - localStorage で永続化（persist ミドルウェア）
 * - 最大 MAX_HISTORY_SIZE 件まで保存
 * - 新しいキーワードが先頭に追加される
 */
export const useSearchHistoryStore = createPersistedStore<SearchHistoryStore>(
  (set) => ({
    history: [],

    addQuery: (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length === 0) return;

      set((state) => {
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
  }),
  "badwave-search-history",
);

export default useSearchHistoryStore;
