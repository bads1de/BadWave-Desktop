/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HeaderNav from "@/components/header/HeaderNav";

const mockPush = jest.fn();
const mockPathname = "/search";
const mockSearchParams = new URLSearchParams("tab=songs");

jest.mock("query-string", () => ({
  stringifyUrl: ({ url, query }: { url: string; query: Record<string, string> }) => {
    const params = new URLSearchParams(query).toString();
    return `${url}?${params}`;
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

describe("HeaderNav", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render navigation tabs", () => {
    render(<HeaderNav />);
    expect(screen.getByText("SONGS_TRACKS")).toBeInTheDocument();
    expect(screen.getByText("PLAYLISTS_DB")).toBeInTheDocument();
  });

  it("should highlight the active tab based on search params", () => {
    render(<HeaderNav />);
    const songsTab = screen.getByText("SONGS_TRACKS");
    const button = songsTab.closest("button");
    expect(button).toBeInTheDocument();
  });

  it("should navigate when clicking a tab", () => {
    render(<HeaderNav />);
    fireEvent.click(screen.getByText("PLAYLISTS_DB"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("tab=playlists"));
  });
});
