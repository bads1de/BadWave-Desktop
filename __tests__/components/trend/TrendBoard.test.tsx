/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import TrendBoard from "@/components/trend/TrendBoard";

jest.mock("@/hooks/player/useOnPlay", () => () => jest.fn());

const mockSongs = [
  { id: "1", title: "Song 1", author: "Artist 1", image_path: "/img1.jpg", song_path: "/s1.mp3", count: "100", like_count: "10", genre: "Pop", created_at: "2023-01-01", user_id: "u1" },
];

describe("TrendBoard", () => {
  it("should render trend board with songs", () => {
    const { container } = render(<TrendBoard songs={mockSongs as any} />);
    expect(container).toBeInTheDocument();
  });

  it("should render loading state", () => {
    const { container } = render(<TrendBoard songs={[]} isLoading={true} />);
    expect(container).toBeInTheDocument();
  });

  it("should render empty state", () => {
    const { container } = render(<TrendBoard songs={[]} />);
    expect(container).toBeInTheDocument();
  });
});
