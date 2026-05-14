/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import SongOptionsPopover from "@/components/song/SongOptionsPopover";

jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({ user: { id: "user-1" } }),
}));

jest.mock("@/hooks/utils/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: true, wasOffline: false, isInitialized: true }),
}));
jest.mock("@/hooks/data/useDownload", () => () => ({ fileUrl: "http://test.com/song.mp3" }));
jest.mock("@/hooks/utils/useDownloadSong", () => () => ({
  download: jest.fn(),
  remove: jest.fn(),
  isDownloaded: false,
  isDownloading: false,
}));
jest.mock("@/libs/songUtils", () => ({
  isLocalSong: () => false,
}));

const mockSong = {
  id: "song-1",
  title: "Test Song",
  author: "Test Artist",
  song_path: "/test.mp3",
  image_path: "/test.jpg",
};

describe("SongOptionsPopover", () => {
  it("should render options button with aria-label", () => {
    render(<SongOptionsPopover song={mockSong as any} />);
    expect(screen.getByLabelText("More Options")).toBeInTheDocument();
  });
});
