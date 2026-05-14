/**
 * @jest-environment jsdom
 */
import { ipc } from "@/libs/electron/ipc";
import { isElectron } from "@/libs/electron/common";

jest.mock("@/libs/electron/common");

describe("electron/ipc", () => {
  const mockIpcInvoke = jest.fn();
  const mockIpcOn = jest.fn().mockReturnValue(jest.fn());
  const mockIpcSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (isElectron as jest.Mock).mockReturnValue(false);
    (window as any).electron = {
      ipc: {
        invoke: mockIpcInvoke,
        on: mockIpcOn,
        send: mockIpcSend,
      },
    };
  });

  describe("invoke", () => {
    it("should call window.electron.ipc.invoke when in Electron", async () => {
      (isElectron as jest.Mock).mockReturnValue(true);
      mockIpcInvoke.mockResolvedValue({ data: "test" });

      const result = await ipc.invoke("test-channel", "arg1");
      expect(result).toEqual({ data: "test" });
      expect(mockIpcInvoke).toHaveBeenCalledWith("test-channel", "arg1");
    });

    it("should reject when not in Electron", async () => {
      await expect(ipc.invoke("test-channel")).rejects.toThrow("Not in Electron environment");
    });
  });

  describe("on", () => {
    it("should register listener when in Electron", () => {
      (isElectron as jest.Mock).mockReturnValue(true);
      const callback = jest.fn();

      ipc.on("test-channel", callback);
      expect(mockIpcOn).toHaveBeenCalledWith("test-channel", callback);
    });

    it("should return noop unsubscribe when not in Electron", () => {
      const callback = jest.fn();
      const unsubscribe = ipc.on("test-channel", callback);
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe("function");
    });
  });

  describe("send", () => {
    it("should send message when in Electron", () => {
      (isElectron as jest.Mock).mockReturnValue(true);

      ipc.send("test-channel", "arg1", "arg2");
      expect(mockIpcSend).toHaveBeenCalledWith("test-channel", "arg1", "arg2");
    });

    it("should not throw when not in Electron", () => {
      expect(() => ipc.send("test-channel")).not.toThrow();
    });
  });
});
