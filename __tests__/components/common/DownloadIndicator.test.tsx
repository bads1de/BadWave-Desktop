/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import DownloadIndicator from "@/components/common/DownloadIndicator";
import useDownloadSong from "@/hooks/utils/useDownloadSong";

jest.mock("@/hooks/utils/useDownloadSong");

const mockSong = {
  id: "song-1",
  title: "Test Song",
  author: "Test Author",
  song_path: "/test.mp3",
  image_path: "/test.jpg",
} as any;

describe("DownloadIndicator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useDownloadSong as unknown as jest.Mock).mockReturnValue({ isDownloaded: false });
  });

  it("should render nothing when not downloaded", () => {
    const { container } = render(<DownloadIndicator song={mockSong} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render cloud done icon when downloaded", () => {
    (useDownloadSong as unknown as jest.Mock).mockReturnValue({ isDownloaded: true });
    const { container } = render(<DownloadIndicator song={mockSong} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("should use song.is_downloaded when available", () => {
    const downloadedSong = { ...mockSong, is_downloaded: true };
    (useDownloadSong as unknown as jest.Mock).mockReturnValue({ isDownloaded: false });
    const { container } = render(<DownloadIndicator song={downloadedSong} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
