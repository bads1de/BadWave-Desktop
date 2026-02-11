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
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-theme-500/20 to-theme-900/20 opacity-0 group-focus-within:opacity-100 transition-all duration-300 -z-10" />
      <div className="relative flex items-center gap-2 w-full rounded-xl bg-neutral-800/80 backdrop-blur-sm border border-white/[0.05] group-hover:border-theme-500/30 group-focus-within:border-theme-500/50 transition-all duration-300 px-4 py-3">
        <BiSearch
          className="text-neutral-400 group-hover:text-neutral-300 group-focus-within:text-theme-500 transition-colors"
          size={22}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-neutral-200 placeholder:text-neutral-400 focus:outline-none text-base"
        />
        {value && (
          <button
            onClick={() => setValue("")}
            className="p-1.5 rounded-lg hover:bg-neutral-700/80 transition-colors"
            aria-label="検索をクリア"
          >
            <IoMdClose
              className="text-neutral-400 hover:text-white transition-colors"
              size={18}
            />
          </button>
        )}
      </div>

      {/* 検索履歴ドロップダウン */}
      {showHistory && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-neutral-900/95 backdrop-blur-md border border-white/[0.08] shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <span className="text-sm font-medium text-neutral-400">
              検索履歴
            </span>
            <button
              onClick={clearHistory}
              className="text-xs text-neutral-500 hover:text-theme-400 transition-colors"
            >
              全て削除
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto custom-scrollbar">
            {history.map((query) => (
              <li
                key={query}
                className="flex items-center w-full hover:bg-white/[0.05] transition-colors group/item"
              >
                <button
                  onClick={() => handleHistoryClick(query)}
                  className="flex-1 flex items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-300 hover:text-white min-w-0"
                >
                  <BiSearch
                    className="text-neutral-500 flex-shrink-0"
                    size={16}
                  />
                  <span className="truncate">{query}</span>
                </button>
                <button
                  onClick={(e) => handleRemoveQuery(e, query)}
                  className="mr-2 p-1 rounded-md opacity-0 group-hover/item:opacity-100 hover:bg-neutral-700/80 text-neutral-400 hover:text-white transition-all flex-shrink-0"
                  aria-label="履歴を削除"
                >
                  <IoMdClose size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchInput;
