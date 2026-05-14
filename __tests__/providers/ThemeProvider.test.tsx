/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import ThemeProvider from "@/providers/ThemeProvider";
import useColorSchemeStore from "@/hooks/stores/useColorSchemeStore";

jest.mock("@/hooks/stores/useColorSchemeStore");

describe("ThemeProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.removeAttribute("data-theme");
    (useColorSchemeStore as unknown as jest.Mock).mockReturnValue({ colorSchemeId: "dark" });
  });

  it("should render children", () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Child Content</div>
      </ThemeProvider>
    );
    expect(getByText("Child Content")).toBeInTheDocument();
  });

  it("should set data-theme attribute after mount", () => {
    jest.useFakeTimers();
    render(
      <ThemeProvider>
        <div>Child</div>
      </ThemeProvider>
    );
    jest.advanceTimersByTime(0);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    jest.useRealTimers();
  });

  it("should update data-theme when colorSchemeId changes", () => {
    jest.useFakeTimers();
    const { rerender } = render(
      <ThemeProvider>
        <div>Child</div>
      </ThemeProvider>
    );
    jest.advanceTimersByTime(0);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    (useColorSchemeStore as unknown as jest.Mock).mockReturnValue({ colorSchemeId: "light" });
    rerender(
      <ThemeProvider>
        <div>Child</div>
      </ThemeProvider>
    );
    jest.advanceTimersByTime(0);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    jest.useRealTimers();
  });
});
