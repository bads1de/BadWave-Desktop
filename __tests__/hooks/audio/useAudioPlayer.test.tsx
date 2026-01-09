/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import useAudioPlayer from "@/hooks/audio/useAudioPlayer";
import usePlayer from "@/hooks/player/usePlayer";
import useVolumeStore from "@/hooks/stores/useVolumeStore";
import usePlaybackStateStore from "@/hooks/stores/usePlaybackStateStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

// Mock stores
jest.mock("@/hooks/player/usePlayer");
jest.mock("@/hooks/stores/useVolumeStore");
jest.mock("@/hooks/stores/usePlaybackStateStore");

// Mock AudioEngine
const mockAudio = {
  paused: true,
  currentTime: 0,
  duration: 180,
  volume: 1,
  src: "",
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const mockEngine = {
  audio: mockAudio,
  isInitialized: true,
  initialize: jest.fn(),
  currentSongId: null,
  context: { state: "running" },
  resumeContext: jest.fn().mockResolvedValue(undefined),
};

jest.mock("@/libs/audio/AudioEngine", () => ({
  AudioEngine: {
    getInstance: jest.fn(() => mockEngine),
  },
}));

describe("useAudioPlayer", () => {
  const songUrl = "https://example.com/song.mp3";
  const mockSong = { id: "song-1", title: "Test Song" };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default store mocks
    (usePlayer as unknown as jest.Mock).mockReturnValue({
      activeId: "song-1",
      ids: ["song-1"],
      isRepeating: false,
      isShuffling: false,
      toggleRepeat: jest.fn(),
      toggleShuffle: jest.fn(),
      getNextSongId: jest.fn(),
      getPreviousSongId: jest.fn(),
      setId: jest.fn(),
    });

    (useVolumeStore as unknown as jest.Mock).mockReturnValue({
      volume: 0.5,
    });

    (usePlaybackStateStore as unknown as jest.Mock).mockReturnValue({
      savePlaybackState: jest.fn(),
      updatePosition: jest.fn(),
      songId: "song-1",
      position: 0,
      hasHydrated: true,
      isRestoring: false,
      setIsRestoring: jest.fn(),
    });

    mockAudio.paused = true;
    mockAudio.src = "";
    mockAudio.currentTime = 0;
    mockEngine.currentSongId = null;
  });

  it("should initialize audio engine if not initialized", () => {
    mockEngine.isInitialized = false;
    renderHook(() => useAudioPlayer(songUrl, mockSong as any));
    expect(mockEngine.initialize).toHaveBeenCalled();
  });

  it("should set audio src and play when isPlaying is toggled", async () => {
    const { result } = renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    expect(mockAudio.src).toBe(songUrl);

    await act(async () => {
      result.current.handlePlay();
    });

    expect(mockAudio.play).toHaveBeenCalled();
  });

  it("should pause audio when handlePlay is toggled again", async () => {
    mockAudio.paused = false;
    const { result } = renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    await act(async () => {
      result.current.handlePlay(); // toggle to false
    });

    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it("should update volume when store changes", () => {
    renderHook(() => useAudioPlayer(songUrl, mockSong as any));
    expect(mockAudio.volume).toBe(0.5);
  });

  it("should seek when handleSeek is called", () => {
    const { result } = renderHook(() => useAudioPlayer(songUrl, mockSong as any));

    act(() => {
      result.current.handleSeek(50);
    });

    expect(mockAudio.currentTime).toBe(50);
  });
});
