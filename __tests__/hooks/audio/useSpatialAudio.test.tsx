/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import useSpatialAudio from "@/hooks/audio/useSpatialAudio";
import useSpatialStore from "@/hooks/stores/useSpatialStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

// Mock AudioEngine
const mockEngine = {
  setSpatialMode: jest.fn(),
  setSlowedReverbMode: jest.fn(),
};

jest.mock("@/libs/audio/AudioEngine", () => ({
  AudioEngine: {
    getInstance: jest.fn(() => mockEngine),
  },
}));

describe("useSpatialAudio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useSpatialStore.setState({ isSpatialEnabled: false });
    });
  });

  it("should enable spatial mode when isSpatialEnabled is true", () => {
    act(() => {
      useSpatialStore.setState({ isSpatialEnabled: true });
    });

    renderHook(() => useSpatialAudio());

    expect(mockEngine.setSpatialMode).toHaveBeenCalledWith(true);
  });

  it("should disable spatial mode when isSpatialEnabled is false", () => {
    renderHook(() => useSpatialAudio());

    expect(mockEngine.setSpatialMode).toHaveBeenCalledWith(false);
  });
});