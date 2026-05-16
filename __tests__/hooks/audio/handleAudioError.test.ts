/**
 * @jest-environment jsdom
 */
import { createAudioErrorHandler } from "@/hooks/audio/audioErrorHandler";

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

import toast from "react-hot-toast";

describe("createAudioErrorHandler", () => {
  let setIsPlaying: jest.Mock;
  let onPlayNext: jest.Mock;
  let errorHandler: ReturnType<typeof createAudioErrorHandler>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    setIsPlaying = jest.fn();
    onPlayNext = jest.fn();
    errorHandler = createAudioErrorHandler({
      maxConsecutiveErrors: 3,
      skipDelayMs: 500,
      setIsPlaying,
      onPlayNext,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should skip to next song on first error", () => {
    errorHandler.handleError();

    expect(setIsPlaying).toHaveBeenCalledWith(false);
    jest.advanceTimersByTime(500);
    expect(onPlayNext).toHaveBeenCalled();
  });

  it("should skip to next song on second error", () => {
    errorHandler.handleError();
    jest.advanceTimersByTime(500);
    errorHandler.handleError();
    jest.advanceTimersByTime(500);

    expect(onPlayNext).toHaveBeenCalledTimes(2);
  });

  it("should show toast and stop after max consecutive errors", () => {
    errorHandler.handleError();
    jest.advanceTimersByTime(500);
    errorHandler.handleError();
    jest.advanceTimersByTime(500);
    errorHandler.handleError();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("再生"),
      expect.any(Object)
    );
    expect(setIsPlaying).toHaveBeenCalledWith(false);
    // 3回目は次曲に進まない
    expect(onPlayNext).toHaveBeenCalledTimes(2);
  });

  it("should reset error count on successful playback", () => {
    errorHandler.handleError();
    jest.advanceTimersByTime(500);
    errorHandler.handleError();
    jest.advanceTimersByTime(500);
    errorHandler.resetErrors();

    errorHandler.handleError();
    jest.advanceTimersByTime(500);

    // リセット後はエラーカウントが初期化されているので、次曲に進む
    expect(onPlayNext).toHaveBeenCalledTimes(3);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should return current error count", () => {
    expect(errorHandler.getErrorCount()).toBe(0);

    errorHandler.handleError();
    expect(errorHandler.getErrorCount()).toBe(1);

    errorHandler.handleError();
    expect(errorHandler.getErrorCount()).toBe(2);
  });
});
