/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import use8DAudio from "@/hooks/audio/use8DAudio";
import useEffectStore from "@/hooks/stores/useEffectStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

// AudioEngine Mock
const mockSet8DAudioMode = jest.fn();
// 初期化状態を可変にするためのオブジェクト
const mockEngineState = { isInitialized: true };

jest.mock("@/libs/audio/AudioEngine", () => ({
  AudioEngine: {
    getInstance: jest.fn(() => ({
      get isInitialized() { return mockEngineState.isInitialized; },
      set8DAudioMode: mockSet8DAudioMode,
    })),
  },
}));

describe("use8DAudio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useEffectStore.setState({
        is8DAudioEnabled: false,
        rotationSpeed: "medium",
      });
    });
    mockEngineState.isInitialized = true;
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => use8DAudio());

    expect(result.current.is8DAudioEnabled).toBe(false);
    expect(result.current.rotationSpeed).toBe("medium");
    // 初期化時にエフェクト適用が走る
    expect(mockSet8DAudioMode).toHaveBeenCalledWith(false, 4); // medium = 4s
  });

  it("should toggle 8D audio", () => {
    const { result } = renderHook(() => use8DAudio());

    act(() => {
      result.current.toggle8DAudio();
    });

    expect(result.current.is8DAudioEnabled).toBe(true);
    expect(mockSet8DAudioMode).toHaveBeenCalledWith(true, 4);
  });

  it("should change rotation speed", () => {
    const { result } = renderHook(() => use8DAudio());

    act(() => {
        // まず有効にする
        result.current.toggle8DAudio();
    });

    act(() => {
      result.current.changeRotationSpeed("fast");
    });

    expect(result.current.rotationSpeed).toBe("fast");
    // fast = 2s
    expect(mockSet8DAudioMode).toHaveBeenCalledWith(true, 2);
  });
  
  it("should do nothing if engine is not initialized", () => {
      mockEngineState.isInitialized = false;
      renderHook(() => use8DAudio());
      
      expect(mockSet8DAudioMode).not.toHaveBeenCalled();
  });
});