/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import useAudioEqualizer from "@/hooks/audio/useAudioEqualizer";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import useEqualizerStore from "@/hooks/stores/useEqualizerStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

// Mock AudioEngine
const mockFilter = { gain: { value: 0 } };
const mockReverbGain = { gain: { setTargetAtTime: jest.fn() } };
const mockContext = { currentTime: 100 };

const mockEngine = {
  isInitialized: true,
  filters: [mockFilter, mockFilter, mockFilter, mockFilter, mockFilter, mockFilter],
  reverbGainNode: mockReverbGain,
  context: mockContext,
};

jest.mock("@/libs/audio/AudioEngine", () => ({
  AudioEngine: {
    getInstance: jest.fn(() => mockEngine),
  },
}));

describe("useAudioEqualizer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      usePlaybackRateStore.setState({ isSlowedReverb: false });
      useEqualizerStore.setState({ isEnabled: true, bands: Array(6).fill({ freq: 100, gain: 5 }) });
    });
    mockFilter.gain.value = 0;
  });

  it("should apply equalizer bands when enabled", async () => {
    renderHook(() => useAudioEqualizer());

    await waitFor(() => {
      expect(mockFilter.gain.value).toBe(5);
    });
  });

  it("should set gain to 0 when disabled", async () => {
    act(() => {
      useEqualizerStore.setState({ isEnabled: false });
    });

    renderHook(() => useAudioEqualizer());

    await waitFor(() => {
      expect(mockFilter.gain.value).toBe(0);
    });
  });

  it("should apply reverb gain when isSlowedReverb is true", async () => {
    act(() => {
      usePlaybackRateStore.setState({ isSlowedReverb: true });
    });

    renderHook(() => useAudioEqualizer());

    await waitFor(() => {
      expect(mockReverbGain.gain.setTargetAtTime).toHaveBeenCalledWith(0.4, 100, 0.1);
    });
  });

  it("should set reverb gain to 0 when isSlowedReverb is false", async () => {
    act(() => {
      usePlaybackRateStore.setState({ isSlowedReverb: false });
    });

    renderHook(() => useAudioEqualizer());

    await waitFor(() => {
      expect(mockReverbGain.gain.setTargetAtTime).toHaveBeenCalledWith(0, 100, 0.1);
    });
  });
});