/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import ForYouBoard from "@/components/foryou/ForYouBoard";

jest.mock("@/hooks/player/useOnPlay", () => () => jest.fn());
jest.mock("@/components/common/SongScrollBoard", () => ({ songs, onPlaySong, emptyState }: any) => 
  songs.length === 0 ? emptyState : <div data-testid="song-scroll-board">{songs.length} songs</div>
);

describe("ForYouBoard", () => {
  it("should render recommendations", () => {
    const mockRecommendations = [
      { id: "1", title: "Song 1", author: "Artist 1", image_path: "/img1.jpg", song_path: "/s1.mp3", count: "100", like_count: "10", genre: "Pop", created_at: "2023-01-01", user_id: "u1" },
    ];
    render(<ForYouBoard recommendations={mockRecommendations as any} />);
    expect(screen.getByTestId("song-scroll-board")).toBeInTheDocument();
  });

  it("should render empty state when no recommendations", () => {
    render(<ForYouBoard recommendations={[]} />);
    expect(screen.getByText(/ALGORITHM_TRAINING_IN_PROGRESS/i)).toBeInTheDocument();
  });
});
