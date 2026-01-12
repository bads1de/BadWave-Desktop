/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import useSlowedReverb from "@/hooks/audio/useSlowedReverb";
import useEffectStore from "@/hooks/stores/useEffectStore";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import { AudioEngine } from "@/libs/audio/AudioEngine";

// AudioEngine Mock
const mockSetPreservesPitch = jest.fn();
const mockSetSlowedReverbMode = jest.fn();
const mockEngineState = { isInitialized: true };

jest.mock("@/libs/audio/AudioEngine", () => ({
  AudioEngine: {
    getInstance: jest.fn(() => ({
      get isInitialized() { return mockEngineState.isInitialized; },
      setPreservesPitch: mockSetPreservesPitch,
      setSlowedReverbMode: mockSetSlowedReverbMode,
    })),
  },
}));

describe("useSlowedReverb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      // ストア初期化
      useEffectStore.setState({ isSlowedReverb: false });
      usePlaybackRateStore.setState({ rate: 1.0 });
    });
    // モックのリセット
    mockEngineState.isInitialized = true;
  });

  it("should initialize with default logic (OFF)", () => {
    renderHook(() => useSlowedReverb());

    // 初期状態ではOFFのロジックが走るはず
    expect(mockSetPreservesPitch).toHaveBeenCalledWith(true);
    expect(mockSetSlowedReverbMode).toHaveBeenCalledWith(false);
    expect(usePlaybackRateStore.getState().rate).toBe(1.0);
  });

  it("should apply Slowed+Reverb effects when enabled", () => {
    renderHook(() => useSlowedReverb());

    act(() => {
      useEffectStore.setState({ isSlowedReverb: true });
    });

    // 1. レートが0.85になること
    expect(usePlaybackRateStore.getState().rate).toBe(0.85);

    // 2. ピッチ補正がOFF (false) になること
    expect(mockSetPreservesPitch).toHaveBeenCalledWith(false);

    // 3. AudioEngineのモードがONになること（リバーブ適用）
    expect(mockSetSlowedReverbMode).toHaveBeenCalledWith(true);
  });

  it("should revert effects when disabled", () => {
    // まず有効にする
    act(() => {
      useEffectStore.setState({ isSlowedReverb: true });
    });

    renderHook(() => useSlowedReverb());

    // 次に無効にする
    act(() => {
      useEffectStore.setState({ isSlowedReverb: false });
    });

    // 1. レートが1.0に戻ること（あるいは以前の値）
    expect(usePlaybackRateStore.getState().rate).toBe(1.0);

    // 2. ピッチ補正がON (true) に戻ること
    expect(mockSetPreservesPitch).toHaveBeenCalledWith(true);

    // 3. AudioEngineのモードがOFFになること
    expect(mockSetSlowedReverbMode).toHaveBeenCalledWith(false);
  });

  it("should store previous rate and restore it", () => {
    act(() => {
      usePlaybackRateStore.setState({ rate: 1.25 });
    });

    renderHook(() => useSlowedReverb());

    // 有効化
    act(() => {
      useEffectStore.setState({ isSlowedReverb: true });
    });
    expect(usePlaybackRateStore.getState().rate).toBe(0.85);

    // 無効化（元の1.25に戻るべき）
    act(() => {
      useEffectStore.setState({ isSlowedReverb: false });
    });
    expect(usePlaybackRateStore.getState().rate).toBe(1.25);
  });
});