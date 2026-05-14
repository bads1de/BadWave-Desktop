/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import LatestBoard from "@/components/latest/LatestBoard";

jest.mock("@/hooks/player/useOnPlay", () => () => jest.fn());
jest.mock("@/hooks/player/usePlayer", () => () => ({ setId: jest.fn() }));
jest.mock("@/components/common/SongScrollBoard", () => ({ songs }: any) => 
  <div data-testid="song-scroll-board">{songs.length} songs</div>
);

describe("LatestBoard", () => {
  const mockSongs = [
    { id: "1", title: "Song 1", author: "Artist 1", image_path: "/img1.jpg", song_path: "/s1.mp3", count: "100", like_count: "10", genre: "Pop", created_at: "2023-01-01", user_id: "u1" },
  ];

  it("should render latest songs", () => {
    render(<LatestBoard songs={mockSongs as any} />);
    expect(screen.getByTestId("song-scroll-board")).toBeInTheDocument();
  });

  it("should render empty state when no songs", () => {
    render(<LatestBoard songs={[]} />);
    expect(screen.getByTestId("song-scroll-board")).toBeInTheDocument();
  });
});
