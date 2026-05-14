/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useMediaControl } from "@/hooks/utils/useMediaControl";

// The hook uses mediaControls from @/libs/electron
jest.mock("@/libs/electron", () => ({
  mediaControls: {
    onMediaControl: jest.fn().mockReturnValue(jest.fn()),
  },
}));

describe("useMediaControl", () => {
  const mockOnPlayPause = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnPrevious = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register media control listener on mount", () => {
    const { onMediaControl } = require("@/libs/electron").mediaControls;

    renderHook(() =>
      useMediaControl({
        onPlayPause: mockOnPlayPause,
        onNext: mockOnNext,
        onPrevious: mockOnPrevious,
      })
    );

    expect(onMediaControl).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should call onPlayPause when play-pause action is received", () => {
    const { onMediaControl } = require("@/libs/electron").mediaControls;
    let callback: Function = jest.fn();
    onMediaControl.mockImplementation((cb: Function) => {
      callback = cb;
      return jest.fn();
    });

    renderHook(() =>
      useMediaControl({
        onPlayPause: mockOnPlayPause,
        onNext: mockOnNext,
        onPrevious: mockOnPrevious,
      })
    );

    callback("play-pause");
    expect(mockOnPlayPause).toHaveBeenCalled();
  });

  it("should call onNext when next action is received", () => {
    const { onMediaControl } = require("@/libs/electron").mediaControls;
    let callback: Function = jest.fn();
    onMediaControl.mockImplementation((cb: Function) => {
      callback = cb;
      return jest.fn();
    });

    renderHook(() =>
      useMediaControl({
        onPlayPause: mockOnPlayPause,
        onNext: mockOnNext,
        onPrevious: mockOnPrevious,
      })
    );

    callback("next");
    expect(mockOnNext).toHaveBeenCalled();
  });

  it("should call onPrevious when previous action is received", () => {
    const { onMediaControl } = require("@/libs/electron").mediaControls;
    let callback: Function = jest.fn();
    onMediaControl.mockImplementation((cb: Function) => {
      callback = cb;
      return jest.fn();
    });

    renderHook(() =>
      useMediaControl({
        onPlayPause: mockOnPlayPause,
        onNext: mockOnNext,
        onPrevious: mockOnPrevious,
      })
    );

    callback("previous");
    expect(mockOnPrevious).toHaveBeenCalled();
  });

  it("should unsubscribe on unmount", () => {
    const mockUnsubscribe = jest.fn();
    const { onMediaControl } = require("@/libs/electron").mediaControls;
    onMediaControl.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() =>
      useMediaControl({
        onPlayPause: mockOnPlayPause,
        onNext: mockOnNext,
        onPrevious: mockOnPrevious,
      })
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
