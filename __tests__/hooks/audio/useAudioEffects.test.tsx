/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import useAudioEffects from "@/hooks/audio/useAudioEffects";
import useEffectStore from "@/hooks/stores/useEffectStore";
import useSpatialStore from "@/hooks/stores/useSpatialStore";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

// AudioEngine Mock
const mockSetPreservesPitch = jest.fn();
const mockSetSlowedReverbMode = jest.fn();
const mockSetSpatialMode = jest.fn();
const mockSet8DAudioMode = jest.fn();
const mockSetLoFiMode = jest.fn();
const mockEngineState = { isInitialized: true };

jest.mock("@/libs/audio/AudioEngine", () => ({
  AudioEngine: {
    getInstance: jest.fn(() => ({
      get isInitialized() { return mockEngineState.isInitialized; },
      setPreservesPitch: mockSetPreservesPitch,
      setSlowedReverbMode: mockSetSlowedReverbMode,
      setSpatialMode: mockSetSpatialMode,
      set8DAudioMode: mockSet8DAudioMode,
      setLoFiMode: mockSetLoFiMode,
    })),
  },
}));

describe("useAudioEffects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      // ストア初期化
      useEffectStore.setState({
        isSlowedReverb: false,
        is8DAudioEnabled: false,
        rotationSpeed: "medium",
        isLoFiEnabled: false,
      });
      useSpatialStore.setState({ isSpatialEnabled: false });
      usePlaybackRateStore.setState({ rate: 1.0 });
    });
    mockEngineState.isInitialized = true;
  });

  describe("Slowed + Reverb", () => {
    it("should apply Slowed+Reverb effects when enabled", () => {
      renderHook(() => useAudioEffects());

      act(() => {
        useEffectStore.setState({ isSlowedReverb: true });
      });

      expect(usePlaybackRateStore.getState().rate).toBe(0.85);
      expect(mockSetPreservesPitch).toHaveBeenCalledWith(false);
      expect(mockSetSlowedReverbMode).toHaveBeenCalledWith(true);
    });

    it("should revert effects when disabled", () => {
      act(() => {
        useEffectStore.setState({ isSlowedReverb: true });
      });

      renderHook(() => useAudioEffects());

      act(() => {
        useEffectStore.setState({ isSlowedReverb: false });
      });

      expect(usePlaybackRateStore.getState().rate).toBe(1.0);
      expect(mockSetPreservesPitch).toHaveBeenCalledWith(true);
      expect(mockSetSlowedReverbMode).toHaveBeenCalledWith(false);
    });

    it("should store previous rate and restore it", () => {
      act(() => {
        usePlaybackRateStore.setState({ rate: 1.25 });
      });

      renderHook(() => useAudioEffects());

      // Enable
      act(() => {
        useEffectStore.setState({ isSlowedReverb: true });
      });
      expect(usePlaybackRateStore.getState().rate).toBe(0.85);

      // Disable
      act(() => {
        useEffectStore.setState({ isSlowedReverb: false });
      });
      expect(usePlaybackRateStore.getState().rate).toBe(1.25);
    });
  });

  describe("Spatial Audio", () => {
    it("should enable spatial mode when isSpatialEnabled is true", () => {
      act(() => {
        useSpatialStore.setState({ isSpatialEnabled: true });
      });

      renderHook(() => useAudioEffects());

      expect(mockSetSpatialMode).toHaveBeenCalledWith(true);
    });

    it("should disable spatial mode when isSpatialEnabled is false", () => {
      renderHook(() => useAudioEffects());
      expect(mockSetSpatialMode).toHaveBeenCalledWith(false);
    });
  });

  describe("8D Audio", () => {
    it("should toggle 8D audio", () => {
      const { result } = renderHook(() => useAudioEffects());

      act(() => {
        result.current.toggle8DAudio();
      });

      expect(result.current.is8DAudioEnabled).toBe(true);
      expect(mockSet8DAudioMode).toHaveBeenCalledWith(true, 4); // medium = 4s
    });

    it("should change rotation speed", () => {
      const { result } = renderHook(() => useAudioEffects());

      act(() => {
        result.current.toggle8DAudio();
      });

      act(() => {
        result.current.change8DRotationSpeed("fast");
      });

      expect(result.current.rotationSpeed).toBe("fast");
      expect(mockSet8DAudioMode).toHaveBeenCalledWith(true, 2); // fast = 2s
    });
  });

  describe("Lo-Fi Mode", () => {
    it("should toggle Lo-Fi mode", () => {
      const { result } = renderHook(() => useAudioEffects());

      act(() => {
        result.current.toggleLoFi();
      });

      expect(result.current.isLoFiEnabled).toBe(true);
      expect(mockSetLoFiMode).toHaveBeenCalledWith(true);

      act(() => {
        result.current.toggleLoFi();
      });

      expect(result.current.isLoFiEnabled).toBe(false);
      expect(mockSetLoFiMode).toHaveBeenCalledWith(false);
    });
  });

  describe("Initialization", () => {
    it("should do nothing if engine is not initialized", () => {
      mockEngineState.isInitialized = false;
      const { result } = renderHook(() => useAudioEffects());
      
      // Lo-Fi check
      act(() => { result.current.toggleLoFi(); });
      expect(mockSetLoFiMode).not.toHaveBeenCalled();

      // 8D Audio check
      act(() => { result.current.toggle8DAudio(); });
      expect(mockSet8DAudioMode).not.toHaveBeenCalled();
    });
  });
});
