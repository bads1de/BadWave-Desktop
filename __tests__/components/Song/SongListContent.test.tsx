/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import SongListContent from "@/components/song/SongListContent";

jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({ user: { id: "user-1" } }),
}));

jest.mock("@/hooks/sync/useSyncLikedSongs", () => ({
  useSyncLikedSongs: () => {},
}));

jest.mock("@/hooks/data/useGetLikedSongs", () => () => ({
  likedSongs: [],
  isLoading: true,
}));

jest.mock("@/hooks/player/useOnPlay", () => () => jest.fn());

// Mock child components
jest.mock("@/components/song/SongList", () => () => <div data-testid="song-list" />);
jest.mock("@/components/song/SongOptionsPopover", () => () => <div data-testid="song-options" />);
jest.mock("@/components/downloads/BulkDownloadButton", () => () => <div data-testid="bulk-download" />);

describe("SongListContent", () => {
  const mockSongs = [
    { id: "1", title: "Song 1", author: "Artist 1", image_path: "/img1.jpg", song_path: "/s1.mp3", count: "100", like_count: "10", genre: "Pop", created_at: "2023-01-01", user_id: "u1" },
    { id: "2", title: "Song 2", author: "Artist 2", image_path: "/img2.jpg", song_path: "/s2.mp3", count: "200", like_count: "20", genre: "Rock", created_at: "2023-01-02", user_id: "u2" },
  ];

  it("should render song items for each song", () => {
    render(<SongListContent songs={mockSongs as any} />);
    const items = screen.getAllByTestId("song-list");
    expect(items).toHaveLength(2);
  });

  it("should render empty state when no songs", () => {
    render(<SongListContent songs={[]} />);
    expect(screen.getByText(/VOID_DETECTED/i)).toBeInTheDocument();
  });

  it("should render with loading state when not providing songs prop", () => {
    render(<SongListContent />);
    expect(screen.getByText(/SYNCING_TRACK_METADATA/i)).toBeInTheDocument();
  });
});
