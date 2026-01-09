/**
 * @jest-environment jsdom
 */
import { act } from "@testing-library/react";
import useAudioWaveStore from "@/hooks/audio/useAudioWave";

// Web Audio API Mocking
const mockAudioContext = {
  createAnalyser: jest.fn(() => ({
    fftSize: 0,
    connect: jest.fn(),
  })),
  createMediaElementSource: jest.fn(() => ({
    connect: jest.fn(),
  })),
  destination: {},
  close: jest.fn(),
  resume: jest.fn().mockResolvedValue(undefined),
  state: "suspended",
};

(window as any).AudioContext = jest.fn(() => mockAudioContext);

// Mock Audio
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  volume: 1,
  currentTime: 0,
  duration: 100,
  src: "",
  crossOrigin: "",
};

(window as any).Audio = jest.fn(() => mockAudio);

describe("useAudioWaveStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAudioWaveStore.getState().cleanup();
    });
  });

  it("should initialize audio correctly", async () => {
    const store = useAudioWaveStore.getState();
    
    await act(async () => {
      await store.initializeAudio("test.mp3", "song-1");
    });

    const state = useAudioWaveStore.getState();
    expect(state.audioUrl).toBe("test.mp3");
    expect(state.currentSongId).toBe("song-1");
    expect(state.audioContext).toBeDefined();
    expect(state.audioElement).toBeDefined();
    expect(window.Audio).toHaveBeenCalledWith("test.mp3");
  });

  it("should play and pause", async () => {
    const store = useAudioWaveStore.getState();
    
    await act(async () => {
      await store.initializeAudio("test.mp3", "song-1");
    });

    await act(async () => {
      await useAudioWaveStore.getState().play();
    });

    expect(useAudioWaveStore.getState().isPlaying).toBe(true);
    expect(mockAudio.play).toHaveBeenCalled();

    act(() => {
      useAudioWaveStore.getState().pause();
    });

    expect(useAudioWaveStore.getState().isPlaying).toBe(false);
    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it("should cleanup correctly", async () => {
    const store = useAudioWaveStore.getState();
    
    await act(async () => {
      await store.initializeAudio("test.mp3", "song-1");
    });

    act(() => {
      useAudioWaveStore.getState().cleanup();
    });

    const state = useAudioWaveStore.getState();
    expect(state.audioElement).toBeNull();
    expect(state.audioContext).toBeNull();
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(mockAudioContext.close).toHaveBeenCalled();
  });
});
