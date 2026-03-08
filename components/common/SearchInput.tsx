"use client";

import qs from "query-string";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useDebounce from "@/hooks/utils/useDebounce";
import { BiSearch } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";
import { useSearchHistoryStore } from "@/hooks/stores/useSearchHistoryStore";

interface SearchInputProps {
  placeholder?: string;
}

interface QueryParams {
  [key: string]: string | undefined;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "曲やプレイリストを検索",
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<string>("");
  const debouncedValue = useDebounce<string>(value, 500);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 検索履歴ストア
  const { history, addQuery, removeQuery, clearHistory } =
    useSearchHistoryStore();

  // 検索履歴ドロップダウンを表示するかどうか
  const showHistory = isFocused && !value && history.length > 0;

  // 初期値をURLから取得
  useEffect(() => {
    const title = searchParams.get("title");

    if (title) {
      setValue(title);
    }
  }, [searchParams]);

  useEffect(() => {
    // 現在のクエリパラメータを維持
    const currentQuery: QueryParams = {};
    searchParams.forEach((value, key) => {
      currentQuery[key] = value;
    });

    const query: QueryParams = {
      ...currentQuery,
      title: debouncedValue || undefined,
    };

    // 空の検索の場合はtitleパラメータを削除
    if (!debouncedValue) {
      query.title = undefined;
    }

    const url = qs.stringifyUrl({
      url: "/search",
      query,
    });

    router.push(url);
  }, [debouncedValue, router, searchParams]);

  // 外側クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Enterキーで検索履歴に追加
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && value.trim()) {
        addQuery(value.trim());
      }
    },
    [value, addQuery],
  );

  // 履歴クリックで検索実行
  const handleHistoryClick = useCallback((query: string) => {
    setValue(query);
    setIsFocused(false);
  }, []);

  // 個別の履歴削除（イベント伝播を防止）
  const handleRemoveQuery = useCallback(
    (e: React.MouseEvent, query: string) => {
      e.stopPropagation();
      removeQuery(query);
    },
    [removeQuery],
  );

  return (
    <div className="relative w-full group" ref={containerRef}>
      <div className="absolute inset-0 rounded-xl bg-theme-500/10 opacity-0 group-focus-within:opacity-100 transition-all duration-300 blur-xl -z-10" />
      <div className="relative flex items-center gap-2 w-full rounded-none bg-[#0a0a0f]/80 backdrop-blur-md border border-theme-500/30 group-hover:border-theme-500/60 group-focus-within:border-theme-500 shadow-[inset_0_0_15px_rgba(var(--theme-500),0.05)] group-focus-within:shadow-[0_0_20px_rgba(var(--theme-500),0.2),inset_0_0_10px_rgba(var(--theme-500),0.1)] transition-all duration-300 px-4 py-3 cyber-glitch">
        {/* HUD装飾 */}
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-theme-500/40 group-focus-within:border-theme-500 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-theme-500/40 group-focus-within:border-theme-500 pointer-events-none" />

        <BiSearch
          className="text-theme-400 group-hover:text-theme-300 group-focus-within:text-theme-500 transition-colors drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)]"
          size={22}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-theme-300 placeholder:text-theme-500/50 focus:outline-none text-base font-mono tracking-wider uppercase"
        />
        {value && (
          <button
            onClick={() => setValue("")}
            className="p-1.5 rounded-none hover:bg-theme-500/20 transition-colors border border-transparent hover:border-theme-500/30"
            aria-label="検索をクリア"
          >
            <IoMdClose
              className="text-theme-400 hover:text-white transition-colors"
              size={18}
            />
          </button>
        )}
      </div>

      {/* 検索履歴ドロップダウン */}
      {showHistory && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-none bg-[#0a0a0f]/95 backdrop-blur-xl border border-theme-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(var(--theme-500),0.1)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-theme-500/20 bg-theme-500/5">
            <span className="text-xs font-mono tracking-[0.2em] text-theme-400 uppercase">
              [ HISTORY_LOG ]
            </span>
            <button
              onClick={clearHistory}
              className="text-[10px] font-mono uppercase text-theme-500 hover:text-white transition-colors hover:underline"
            >
              Clear_All
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto custom-scrollbar p-1 font-mono">
            {history.map((query) => (
              <li
                key={query}
                className="flex items-center w-full hover:bg-theme-500/10 transition-colors group/item rounded-none m-1"
              >
                <button
                  onClick={() => handleHistoryClick(query)}
                  className="flex-1 flex items-center gap-3 px-3 py-2 text-left text-sm text-theme-300 hover:text-white min-w-0"
                >
                  <BiSearch
                    className="text-theme-500/60 flex-shrink-0"
                    size={16}
                  />
                  <span className="truncate uppercase tracking-tight">
                    {query}
                  </span>
                </button>
                <button
                  onClick={(e) => handleRemoveQuery(e, query)}
                  className="mr-2 p-1 rounded-none opacity-0 group-hover/item:opacity-100 hover:bg-theme-500/30 text-theme-400 hover:text-white transition-all flex-shrink-0 border border-transparent hover:border-theme-500/40"
                  aria-label="履歴を削除"
                >
                  <IoMdClose size={14} />
                </button>
              </li>
            ))}
          </ul>
          {/* 装飾的なHUDライン */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-theme-500/30 to-transparent" />
        </div>
      )}
    </div>
  );
};

export default SearchInput;
