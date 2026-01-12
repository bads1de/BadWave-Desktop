/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import usePlaybackRate from "@/hooks/audio/usePlaybackRate";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

// Mock AudioEngine
const mockAudio = {
  playbackRate: 1,
  preservesPitch: true,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

jest.mock("@/libs/audio/AudioEngine", () => ({
  AudioEngine: {
    getInstance: jest.fn(() => ({
      audio: mockAudio,
    })),
  },
}));

describe("usePlaybackRate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      usePlaybackRateStore.setState({ rate: 1.0 });
    });
    mockAudio.playbackRate = 1.0;
  });

  it("should set initial playback rate to audio element", () => {
    act(() => {
      usePlaybackRateStore.setState({ rate: 1.5 });
    });

    renderHook(() => usePlaybackRate());

    expect(mockAudio.playbackRate).toBe(1.5);
  });

  it("should update audio playback rate when store changes", () => {
    renderHook(() => usePlaybackRate());

    expect(mockAudio.playbackRate).toBe(1.0);

    act(() => {
      usePlaybackRateStore.getState().setRate(2.0);
    });

    expect(mockAudio.playbackRate).toBe(2.0);
  });

  it("should re-apply playback rate on durationchange event", () => {
    act(() => {
      usePlaybackRateStore.setState({ rate: 1.25 });
    });

    renderHook(() => usePlaybackRate());

    // Simulate browser resetting playbackRate on source change
    mockAudio.playbackRate = 1.0;

    const durationChangeHandler = (
      mockAudio.addEventListener as jest.Mock
    ).mock.calls.find((call) => call[0] === "durationchange")[1];

    act(() => {
      durationChangeHandler();
    });

    expect(mockAudio.playbackRate).toBe(1.25);
  });
});
