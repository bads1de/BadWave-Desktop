/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import useLoFiAudio from "@/hooks/audio/useLoFiAudio";
import useEffectStore from "@/hooks/stores/useEffectStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

// AudioEngine Mock
const mockSetLoFiMode = jest.fn();
const mockEngineState = { isInitialized: true };

jest.mock("@/libs/audio/AudioEngine", () => ({
  AudioEngine: {
    getInstance: jest.fn(() => ({
      get isInitialized() { return mockEngineState.isInitialized; },
      setLoFiMode: mockSetLoFiMode,
    })),
  },
}));

describe("useLoFiAudio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useEffectStore.setState({ isLoFiEnabled: false });
    });
    mockEngineState.isInitialized = true;
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useLoFiAudio());

    expect(result.current.isLoFiEnabled).toBe(false);
    expect(mockSetLoFiMode).toHaveBeenCalledWith(false);
  });

  it("should toggle Lo-Fi mode", () => {
    const { result } = renderHook(() => useLoFiAudio());

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
  
  it("should do nothing if engine is not initialized", () => {
    mockEngineState.isInitialized = false;
    renderHook(() => useLoFiAudio());
    expect(mockSetLoFiMode).not.toHaveBeenCalled();
  });
});