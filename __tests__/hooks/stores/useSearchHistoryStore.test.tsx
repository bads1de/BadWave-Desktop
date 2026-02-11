import { renderHook, act } from "@testing-library/react";
import {
  useSearchHistoryStore,
  MAX_HISTORY_SIZE,
} from "@/hooks/stores/useSearchHistoryStore";

describe("hooks/stores/useSearchHistoryStore", () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    const { result } = renderHook(() => useSearchHistoryStore());
    act(() => {
      result.current.clearHistory();
    });
  });

  // ============================
  // 初期状態
  // ============================
  describe("初期状態", () => {
    it("履歴が空配列で初期化される", () => {
      const { result } = renderHook(() => useSearchHistoryStore());
      expect(result.current.history).toEqual([]);
    });
  });

  // ============================
  // addQuery
  // ============================
  describe("addQuery", () => {
    it("検索キーワードを履歴に追加できる", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("テスト検索");
      });

      expect(result.current.history).toEqual(["テスト検索"]);
    });

    it("新しいキーワードが先頭に追加される", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("first");
      });
      act(() => {
        result.current.addQuery("second");
      });

      expect(result.current.history).toEqual(["second", "first"]);
    });

    it("空文字は追加されない", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("");
      });

      expect(result.current.history).toEqual([]);
    });

    it("空白のみの文字列は追加されない", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("   ");
      });

      expect(result.current.history).toEqual([]);
    });

    it("前後の空白がトリムされる", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("  hello  ");
      });

      expect(result.current.history).toEqual(["hello"]);
    });

    it("重複するキーワードは先頭に移動される", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("first");
      });
      act(() => {
        result.current.addQuery("second");
      });
      act(() => {
        result.current.addQuery("first");
      });

      expect(result.current.history).toEqual(["first", "second"]);
    });

    it(`最大${MAX_HISTORY_SIZE}件まで保存される`, () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      // MAX_HISTORY_SIZE + 5 件追加
      for (let i = 0; i < MAX_HISTORY_SIZE + 5; i++) {
        act(() => {
          result.current.addQuery(`query-${i}`);
        });
      }

      expect(result.current.history).toHaveLength(MAX_HISTORY_SIZE);
      // 最新が先頭
      expect(result.current.history[0]).toBe(`query-${MAX_HISTORY_SIZE + 4}`);
    });

    it("最大件数を超えた場合、古いものから削除される", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      for (let i = 0; i < MAX_HISTORY_SIZE + 1; i++) {
        act(() => {
          result.current.addQuery(`query-${i}`);
        });
      }

      // 最も古い query-0 は削除されている
      expect(result.current.history).not.toContain("query-0");
      // 最新の query-{MAX_HISTORY_SIZE} は残っている
      expect(result.current.history[0]).toBe(`query-${MAX_HISTORY_SIZE}`);
    });
  });

  // ============================
  // removeQuery
  // ============================
  describe("removeQuery", () => {
    it("指定したキーワードを履歴から削除できる", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("first");
      });
      act(() => {
        result.current.addQuery("second");
      });
      act(() => {
        result.current.addQuery("third");
      });

      act(() => {
        result.current.removeQuery("second");
      });

      expect(result.current.history).toEqual(["third", "first"]);
    });

    it("存在しないキーワードを削除しても何も起きない", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("existing");
      });

      act(() => {
        result.current.removeQuery("nonexistent");
      });

      expect(result.current.history).toEqual(["existing"]);
    });
  });

  // ============================
  // clearHistory
  // ============================
  describe("clearHistory", () => {
    it("履歴を全て削除できる", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("first");
      });
      act(() => {
        result.current.addQuery("second");
      });

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history).toEqual([]);
    });
  });

  // ============================
  // 状態の共有
  // ============================
  describe("状態の共有", () => {
    it("複数のコンポーネントで状態が共有される", () => {
      const { result: result1 } = renderHook(() => useSearchHistoryStore());
      const { result: result2 } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result1.current.addQuery("shared query");
      });

      expect(result1.current.history).toEqual(["shared query"]);
      expect(result2.current.history).toEqual(["shared query"]);
    });
  });
});
