/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import useAudioEqualizer from "@/hooks/audio/useAudioEqualizer";
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
});
