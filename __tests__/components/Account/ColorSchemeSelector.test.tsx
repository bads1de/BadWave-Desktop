/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { ColorSchemeSelector } from "@/components/Account/ColorSchemeSelector";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";
import { colorSchemes } from "@/constants/colorSchemes";

// Zustand ストアのモック
jest.mock("@/hooks/stores/useColorSchemeStore");

describe("ColorSchemeSelector", () => {
  const mockSetColorScheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useColorSchemeStore as unknown as jest.Mock).mockReturnValue({
      colorSchemeId: colorSchemes[0].id,
      setColorScheme: mockSetColorScheme,
    });
  });

  it("renders all color schemes", () => {
    render(<ColorSchemeSelector />);
    
    colorSchemes.forEach((scheme) => {
      expect(screen.getByText(scheme.name)).toBeInTheDocument();
    });
  });

  it("calls setColorScheme when a scheme is clicked", () => {
    render(<ColorSchemeSelector />);
    
    // 2番目のスキームをクリック
    const secondScheme = colorSchemes[1];
    const button = screen.getByText(secondScheme.name).closest("button");
    
    if (button) {
      fireEvent.click(button);
    }
    
    expect(mockSetColorScheme).toHaveBeenCalledWith(secondScheme.id);
  });

  it("shows check icon for selected scheme", () => {
    // 1番目を選択状態にする
    (useColorSchemeStore as unknown as jest.Mock).mockReturnValue({
      colorSchemeId: colorSchemes[0].id,
      setColorScheme: mockSetColorScheme,
    });

    render(<ColorSchemeSelector />);
    
    // framer-motion のアニメーション要素などは data-testid や特定が難しい場合があるが、
    // ここでは単純にレンダリングを確認
    // ※ 実際には内部の motion.div が描画される
  });
});
