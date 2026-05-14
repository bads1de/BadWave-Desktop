/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import SongScrollBoard from "@/components/common/SongScrollBoard";

// Mock child components
jest.mock("@/components/song/SongItem", () => ({ data }: any) => <div data-testid="song-item">{data.title}</div>);
jest.mock("@/components/common/ScrollableContainer", () => ({ children }: any) => <div data-testid="scrollable">{children}</div>);

describe("SongScrollBoard", () => {
  const mockSongs = [
    { id: "1", title: "Song 1", author: "Artist 1", image_path: "/img1.jpg", song_path: "/s1.mp3", count: "100", like_count: "10", genre: "Pop", created_at: "2023-01-01", user_id: "u1" },
    { id: "2", title: "Song 2", author: "Artist 2", image_path: "/img2.jpg", song_path: "/s2.mp3", count: "200", like_count: "20", genre: "Rock", created_at: "2023-01-02", user_id: "u2" },
  ];

  it("should render songs", () => {
    render(<SongScrollBoard songs={mockSongs as any} onPlaySong={jest.fn()} />);
    const items = screen.getAllByTestId("song-item");
    expect(items).toHaveLength(2);
  });

  it("should render empty state when no songs", () => {
    render(<SongScrollBoard songs={[]} onPlaySong={jest.fn()} />);
    expect(screen.getByText(/NO_DATA_STREAMS_IN_BUFFER/i)).toBeInTheDocument();
  });
});
