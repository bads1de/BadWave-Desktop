/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import MediaItem from "@/components/song/MediaItem";

// Mock required hooks
jest.mock("@/hooks/player/usePlayer", () => () => ({ setId: jest.fn() }));
jest.mock("@/hooks/utils/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: true, wasOffline: false, isInitialized: true }),
}));
jest.mock("@/hooks/utils/useDownloadSong", () => () => ({ isDownloaded: false }));
jest.mock("@/libs/songUtils", () => ({
  getPlayableImagePath: (data: any) => data.image_path,
}));

const mockSong = {
  id: "song-1",
  title: "Test Song",
  author: "Test Artist",
  song_path: "/test.mp3",
  image_path: "/test.jpg",
};

describe("MediaItem", () => {
  it("should render song title and author", () => {
    const { container } = render(<MediaItem data={mockSong as any} />);
    expect(container.textContent).toContain("Test Song");
    expect(container.textContent).toContain("Test Artist");
  });

  it("should render image", () => {
    render(<MediaItem data={mockSong as any} />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
  });

  it("should handle click when onClick is provided", () => {
    const onClick = jest.fn();
    render(<MediaItem data={mockSong as any} onClick={onClick} />);
    const item = screen.getByText(/Test Song/i).closest("div");
    item?.click();
    expect(onClick).toHaveBeenCalledWith("song-1");
  });
});
