/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SongList from "@/components/Song/SongList";
import usePlayer from "@/hooks/player/usePlayer";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { Song } from "@/types";

// Mock hooks
jest.mock("@/hooks/player/usePlayer");
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("@/hooks/utils/useDownloadSong");

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} fill={props.fill ? "true" : undefined} />;
  },
}));

describe("SongList", () => {
  const mockSong: Song = {
    id: "song-1",
    title: "Test Song",
    author: "Artist",
    genre: "Pop",
    song_path: "https://example.com/song.mp3",
    image_path: "/test-image.jpg",
    user_id: "user-1",
    count: 10,
    like_count: 5,
  };

  const mockSetId = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePlayer as unknown as jest.Mock).mockReturnValue({
      setId: mockSetId,
    });
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    (useDownloadSong as jest.Mock).mockReturnValue({ isDownloaded: false });
  });

  it("should render song info correctly", () => {
    render(<SongList data={mockSong} />);
    expect(screen.getByText("Test Song")).toBeInTheDocument();
    expect(screen.getByText("Artist")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument(); // play count
    expect(screen.getByText("5")).toBeInTheDocument(); // like count
  });

  it("should call player.setId when clicked and online", () => {
    render(<SongList data={mockSong} />);
    
    const image = screen.getByAltText("Test Song");
    const imageContainer = image.parentElement;
    if (imageContainer) {
      fireEvent.click(imageContainer);
      expect(mockSetId).toHaveBeenCalledWith("song-1");
    }
  });

  it("should show offline icon and be unclickable when offline and not downloaded", () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
    (useDownloadSong as jest.Mock).mockReturnValue({ isDownloaded: false });

    render(<SongList data={mockSong} />);
    
    // The component applies cursor-not-allowed opacity-40 grayscale to the outermost div
    // screen.getByText("Test Song").closest(".flex") might find it
    const outerDiv = screen.getByText("Test Song").closest(".flex.items-center");
    expect(outerDiv).toHaveClass("cursor-not-allowed");
    
    const image = screen.getByAltText("Test Song");
    const imageContainer = image.parentElement;
    if (imageContainer) {
      fireEvent.click(imageContainer);
      expect(mockSetId).not.toHaveBeenCalled();
    }
  });

  it("should be playable when offline but downloaded", () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
    (useDownloadSong as jest.Mock).mockReturnValue({ isDownloaded: true });

    render(<SongList data={mockSong} />);
    
    const outerDiv = screen.getByText("Test Song").closest(".flex.items-center");
    expect(outerDiv).toHaveClass("cursor-pointer");
    
    const image = screen.getByAltText("Test Song");
    const imageContainer = image.parentElement;
    if (imageContainer) {
      fireEvent.click(imageContainer);
      expect(mockSetId).toHaveBeenCalledWith("song-1");
    }
  });
});