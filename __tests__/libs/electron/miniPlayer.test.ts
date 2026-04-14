/**
 * @jest-environment jsdom
 */
import { miniPlayer } from "@/libs/electron/miniPlayer";

describe("libs/electron/miniPlayer", () => {
  const mockMiniPlayer = {
    open: jest.fn().mockResolvedValue({ success: true }),
    close: jest.fn().mockResolvedValue({ success: true }),
    updateState: jest.fn().mockResolvedValue({ success: true }),
    control: jest.fn().mockResolvedValue({ success: true }),
    isOpen: jest.fn().mockResolvedValue(true),
    ready: jest.fn().mockResolvedValue({ success: true }),
    onStateChange: jest.fn().mockReturnValue(() => {}),
    onRequestState: jest.fn().mockReturnValue(() => {}),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).electron = {
      ...(window as any).electron,
      miniPlayer: mockMiniPlayer,
    };
  });

  it("should open miniPlayer in electron", async () => {
    await miniPlayer.open();
    expect(mockMiniPlayer.open).toHaveBeenCalled();
  });

  it("should close miniPlayer in electron", async () => {
    await miniPlayer.close();
    expect(mockMiniPlayer.close).toHaveBeenCalled();
  });

  it("should update state in electron", async () => {
    const state = { song: null, isPlaying: false };
    await miniPlayer.updateState(state);
    expect(mockMiniPlayer.updateState).toHaveBeenCalledWith(state);
  });

  it("should control playback in electron", async () => {
    await miniPlayer.control("play-pause");
    expect(mockMiniPlayer.control).toHaveBeenCalledWith("play-pause");
  });

  it("should check if open in electron", async () => {
    const result = await miniPlayer.isOpen();
    expect(result).toBe(true);
    expect(mockMiniPlayer.isOpen).toHaveBeenCalled();
  });

  it("should notify ready in electron", async () => {
    await miniPlayer.ready();
    expect(mockMiniPlayer.ready).toHaveBeenCalled();
  });

  it("should register onStateChange listener in electron", () => {
    const cb = jest.fn();
    miniPlayer.onStateChange(cb);
    expect(mockMiniPlayer.onStateChange).toHaveBeenCalledWith(cb);
  });

  it("should register onRequestState listener in electron", () => {
    const cb = jest.fn();
    miniPlayer.onRequestState(cb);
    expect(mockMiniPlayer.onRequestState).toHaveBeenCalledWith(cb);
  });

  it("should handle errors and return fallback in electron environment", async () => {
    mockMiniPlayer.open.mockRejectedValueOnce(new Error("IPC Error"));
    
    const result = await miniPlayer.open();
    expect(result).toEqual({ success: false, error: "Error: IPC Error" });
  });

  it("should handle non-object fallback with error in electron environment", async () => {
    mockMiniPlayer.isOpen.mockRejectedValueOnce(new Error("IPC Error"));
    
    const result = await miniPlayer.isOpen();
    expect(result).toBe(false); // fallback value
  });

  it("should handle errors in listeners in electron environment", () => {
    mockMiniPlayer.onStateChange.mockImplementationOnce(() => {
      throw new Error("Listener Error");
    });
    
    const result = miniPlayer.onStateChange(jest.fn());
    expect(result).toBeDefined();
    expect(typeof result).toBe("function");
  });
});
