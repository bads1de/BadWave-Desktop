import { render, screen, fireEvent, act } from "@testing-library/react";
import SearchInput from "@/components/common/SearchInput";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchHistoryStore } from "@/hooks/stores/useSearchHistoryStore";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock query-string to avoid ESM issues
jest.mock("query-string", () => ({
  stringifyUrl: jest.fn(({ url, query }) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value as string);
      }
    });
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }),
}));

// Mock useDebounce to avoid timer issues in this component test,
// or use real timers. Since we want to test interaction with router,
// let's use fake timers.
jest.mock("@/hooks/utils/useDebounce", () => ({
  __esModule: true,
  default: jest.fn((value) => value), // No delay mock for simplicity
}));

describe("components/common/SearchInput", () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    // Default empty search params
    const mockSearchParams = new URLSearchParams();
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    // 検索履歴をリセット
    useSearchHistoryStore.getState().clearHistory();
  });

  it("renders correctly with placeholder", () => {
    render(<SearchInput />);
    expect(
      screen.getByPlaceholderText("曲やプレイリストを検索"),
    ).toBeInTheDocument();
  });

  it("initializes with value from URL", () => {
    const params = new URLSearchParams();
    params.set("title", "Initial Query");
    (useSearchParams as jest.Mock).mockReturnValue(params);

    render(<SearchInput />);
    expect(screen.getByRole("textbox")).toHaveValue("Initial Query");
  });

  it("updates input value on change", () => {
    render(<SearchInput />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Hello" } });
    expect(input).toHaveValue("Hello");

    // Expect router.push to be called with correct URL query
    expect(mockPush).toHaveBeenCalledWith("/search?title=Hello");
  });

  it("clears input when close button is clicked", () => {
    // Setup initial state with a search query
    const params = new URLSearchParams();
    params.set("title", "Hello");
    (useSearchParams as jest.Mock).mockReturnValue(params);

    render(<SearchInput />);
    const input = screen.getByRole("textbox");

    // Check initial state
    expect(input).toHaveValue("Hello");

    // Click clear
    const clearButton = screen.getByLabelText("検索をクリア");
    fireEvent.click(clearButton);
    expect(input).toHaveValue("");

    // Expect router.push to be called to remove the query param
    // Since currentTitle is "Hello" and debouncedValue is "", the condition
    // (currentTitle !== debouncedValue && (currentTitle || debouncedValue))
    // becomes (true && true), so push should be called.
    expect(mockPush).toHaveBeenCalledWith("/search");
  });

  // ============================
  // 検索履歴
  // ============================
  describe("検索履歴", () => {
    it("Enterキー押下で検索履歴に追加される", () => {
      render(<SearchInput />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "テスト検索" } });
      fireEvent.keyDown(input, { key: "Enter" });

      const history = useSearchHistoryStore.getState().history;
      expect(history).toContain("テスト検索");
    });

    it("空文字でEnterを押しても履歴に追加されない", () => {
      render(<SearchInput />);
      const input = screen.getByRole("textbox");

      fireEvent.keyDown(input, { key: "Enter" });

      const history = useSearchHistoryStore.getState().history;
      expect(history).toHaveLength(0);
    });

    it("フォーカス時に検索履歴が表示される", () => {
      // 先に履歴を追加
      useSearchHistoryStore.getState().addQuery("履歴1");
      useSearchHistoryStore.getState().addQuery("履歴2");

      render(<SearchInput />);
      const input = screen.getByRole("textbox");

      // フォーカスすると履歴が表示
      fireEvent.focus(input);

      expect(screen.getByText("履歴1")).toBeInTheDocument();
      expect(screen.getByText("履歴2")).toBeInTheDocument();
    });

    it("履歴がない場合はドロップダウンが表示されない", () => {
      render(<SearchInput />);
      const input = screen.getByRole("textbox");

      fireEvent.focus(input);

      expect(screen.queryByText("検索履歴")).not.toBeInTheDocument();
    });

    it("履歴をクリックすると入力欄にセットされる", () => {
      useSearchHistoryStore.getState().addQuery("クリック用");

      render(<SearchInput />);
      const input = screen.getByRole("textbox");

      fireEvent.focus(input);
      fireEvent.click(screen.getByText("クリック用"));

      expect(input).toHaveValue("クリック用");
    });

    it("個別の履歴を削除できる", () => {
      useSearchHistoryStore.getState().addQuery("削除対象");
      useSearchHistoryStore.getState().addQuery("残す履歴");

      render(<SearchInput />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      // 削除ボタンをクリック
      const deleteButtons = screen.getAllByLabelText("履歴を削除");
      // 「削除対象」は2番目（残す履歴が先頭）
      fireEvent.click(deleteButtons[1]);

      expect(screen.queryByText("削除対象")).not.toBeInTheDocument();
      expect(screen.getByText("残す履歴")).toBeInTheDocument();
    });

    it("全履歴をクリアできる", () => {
      useSearchHistoryStore.getState().addQuery("履歴A");
      useSearchHistoryStore.getState().addQuery("履歴B");

      render(<SearchInput />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);

      fireEvent.click(screen.getByText("全て削除"));

      expect(screen.queryByText("履歴A")).not.toBeInTheDocument();
      expect(screen.queryByText("履歴B")).not.toBeInTheDocument();
    });

    it("テキスト入力中は検索履歴が表示されない", () => {
      useSearchHistoryStore.getState().addQuery("非表示にすべき");

      render(<SearchInput />);
      const input = screen.getByRole("textbox");

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "something" } });

      expect(screen.queryByText("非表示にすべき")).not.toBeInTheDocument();
    });
  });
});
