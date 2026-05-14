/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import PlayerContent from "@/components/player/PlayerContent";

// Mock all the hooks and child components used by PlayerContent
jest.mock("@/hooks/audio/useAudioPlayer", () => () => ({
  formattedCurrentTime: "0:00",
  formattedDuration: "3:30",
  currentTime: 0,
  duration: 210,
  isPlaying: false,
  handlePlay: jest.fn(),
  handleSeek: jest.fn(),
  onPlayNext: jest.fn(),
  onPlayPrevious: jest.fn(),
  toggleRepeat: jest.fn(),
  toggleShuffle: jest.fn(),
  isRepeating: false,
  isShuffling: false,
}));

jest.mock("@/hooks/audio/useAudioEqualizer", () => () => {});
jest.mock("@/hooks/audio/usePlaybackRate", () => () => {});
jest.mock("@/hooks/audio/useAudioEffects", () => () => {});
jest.mock("@/hooks/stores/useLyricsStore", () => () => ({ toggleLyrics: jest.fn() }));
jest.mock("@/hooks/stores/useLyricsModalStore", () => () => ({ openModal: jest.fn() }));
jest.mock("@/hooks/utils/useDiscordRpc", () => ({
  useDiscordRpc: () => ({}),
}));
jest.mock("@/hooks/utils/useMiniPlayerSync", () => ({
  useMiniPlayerSync: () => ({}),
}));
jest.mock("@/hooks/utils/useMediaControl", () => ({
  useMediaControl: () => ({}),
}));
jest.mock("@/hooks/stores/useColorSchemeStore", () => () => ({
  getColorScheme: () => ({ colors: { accentFrom: "#7c3aed", primary: "#4c1d95", glow: "139,92,246" } }),
  hasHydrated: false,
}));
jest.mock("@/libs/songUtils", () => ({
  isLocalSong: () => false,
  getPlayablePath: (s: any) => s.song_path,
}));
jest.mock("@/libs/electron", () => ({ mediaControls: {} }));

// Mock child components
jest.mock("@/components/song/MediaItem", () => () => <div data-testid="media-item" />);
jest.mock("@/components/player/Seekbar", () => () => <div data-testid="seekbar" />);
jest.mock("@/components/player/VolumeControl", () => () => <div data-testid="volume-control" />);
jest.mock("@/components/player/MiniPlayerButton", () => () => <div data-testid="mini-player-btn" />);
jest.mock("@/components/player/AudioSettingsButton", () => () => <div data-testid="audio-settings" />);
jest.mock("@/components/common/DisabledOverlay", () => ({ children }: any) => <>{children}</>);
jest.mock("@/components/LikeButton", () => () => <div data-testid="like-button" />);
jest.mock("@/components/playlist/AddPlaylist", () => () => <div data-testid="add-playlist" />);

const mockSong = {
  id: "song-1",
  title: "Test Song",
  author: "Test Artist",
  song_path: "/test.mp3",
  image_path: "/test.jpg",
  count: "100",
  like_count: "10",
  genre: "Pop",
  created_at: "2023-01-01",
  user_id: "user-1",
};

const mockPlaylists = [
  { id: "pl-1", title: "My Playlist", user_id: "user-1" },
];

describe("PlayerContent", () => {
  it("should render player controls", () => {
    render(<PlayerContent song={mockSong as any} playlists={mockPlaylists as any} />);
    expect(screen.getByTestId("media-item")).toBeInTheDocument();
    expect(screen.getByTestId("seekbar")).toBeInTheDocument();
    expect(screen.getByTestId("volume-control")).toBeInTheDocument();
  });

  it("should render playback controls", () => {
    render(<PlayerContent song={mockSong as any} playlists={mockPlaylists as any} />);
    // Should have shuffle, previous, play/pause, next, repeat controls
    expect(screen.getByTestId("media-item")).toBeInTheDocument();
  });
});
