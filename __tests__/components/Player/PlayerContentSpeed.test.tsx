import React, { useRef } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlayerContent from "@/components/player/PlayerContent";
import useAudioPlayer from "@/hooks/audio/useAudioPlayer";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { Song, Playlist } from "@/types";

// Mock hooks
jest.mock("@/hooks/audio/useAudioPlayer");
jest.mock("@/hooks/stores/useLyricsStore", () => ({
  __esModule: true,
  default: () => ({ toggleLyrics: jest.fn() }),
}));
jest.mock("@/hooks/stores/useEqualizerStore", () => ({
  __esModule: true,
  default: () => false, // isEnabled
}));
jest.mock("@/hooks/audio/useAudioEqualizer", () => ({
  __esModule: true,
  default: () => {},
}));
jest.mock("@/libs/electron", () => ({
  isElectron: jest.fn().mockReturnValue(true),
  mediaControls: {
    onMediaControl: jest.fn(() => () => {}),
  },
  miniPlayer: {
    onRequestState: jest.fn(() => () => {}),
    updateState: jest.fn(),
  },
}));

// Mock components to avoid rendering full tree
jest.mock("@/components/LikeButton", () => ({
  __esModule: true,
  default: () => <button data-testid="like-button">Like</button>,
}));
jest.mock("@/components/song/MediaItem", () => ({
  __esModule: true,
  default: () => <div data-testid="media-item">Song Info</div>,
}));
jest.mock("@/components/playlist/AddPlaylist", () => ({
  __esModule: true,
  default: () => <button data-testid="add-playlist">Add Playlist</button>,
}));
jest.mock("@/components/equalizer/EqualizerControl", () => ({
  __esModule: true,
  default: () => <div data-testid="equalizer-control">Equalizer Control</div>,
}));

describe("PlayerContent Playback Speed", () => {
  const mockSong: Song = {
    id: "1",
    title: "Test Song",
    author: "Test Artist",
    song_path: "http://example.com/song.mp3",
    image_path: "http://example.com/image.jpg",
    user_id: "user1",
    created_at: "2024-01-01",
  };
  const mockPlaylists: Playlist[] = [];

  const mockUseAudioPlayer = useAudioPlayer as jest.Mock;

  beforeEach(() => {
    mockUseAudioPlayer.mockReturnValue({
      Icon: () => <span>Play</span>,
      VolumeIcon: () => <span>Volume</span>,
      formattedCurrentTime: "0:00",
      formattedDuration: "3:00",
      volume: 1,
      setVolume: jest.fn(),
      audioRef: { current: document.createElement("audio") }, // Ensure audioRef is provided
      currentTime: 0,
      duration: 180,
      isPlaying: false,
      isRepeating: false,
      isShuffling: false,
      handlePlay: jest.fn(),
      handleSeek: jest.fn(),
      onPlayNext: jest.fn(),
      onPlayPrevious: jest.fn(),
      toggleRepeat: jest.fn(),
      toggleShuffle: jest.fn(),
      handleVolumeClick: jest.fn(),
      showVolumeSlider: false,
      setShowVolumeSlider: jest.fn(),
    });

    // Reset store
    usePlaybackRateStore.setState({ rate: 1.0 });
  });

  it("should render settings button", () => {
    render(<PlayerContent song={mockSong} playlists={mockPlaylists} />);
    expect(screen.getByTestId("audio-settings-button")).toBeInTheDocument();
  });

  it("should open popover and show options when clicked", async () => {
    render(<PlayerContent song={mockSong} playlists={mockPlaylists} />);

    const settingsButton = screen.getByTestId("audio-settings-button");
    fireEvent.click(settingsButton);

    // PlaybackSpeedButton has: [0.9, 0.95, 1, 1.05, 1.1, 1.25]
    // Note: It's now formatted as "1.00x" in some places but buttons might be "1x"
    expect(await screen.findByText("1.25x")).toBeInTheDocument();
    expect(screen.getByText("0.9x")).toBeInTheDocument();
  });

  it("should change playback rate when option is clicked", async () => {
    render(<PlayerContent song={mockSong} playlists={mockPlaylists} />);

    const settingsButton = screen.getByTestId("audio-settings-button");
    fireEvent.click(settingsButton);

    const speed125 = await screen.findByText("1.25x");
    fireEvent.click(speed125);

    // Check if store updated
    expect(usePlaybackRateStore.getState().rate).toBe(1.25);
  });
});
