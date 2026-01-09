/**
 * @jest-environment jsdom
 */
import { electronAPI, isNetworkError } from "@/libs/electron/index";

describe("libs/electron API wrappers", () => {
  const originalElectron = (window as any).electron;

  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).electron = originalElectron;
  });

  describe("common", () => {
    it("isElectron should return true in mock environment", () => {
      expect(electronAPI.isElectron()).toBe(true);
    });

    it("getAppVersion should return version from mock", () => {
      expect(electronAPI.getAppVersion()).toBe("0.1.0");
    });

    it("getPlatform should return platform from mock", () => {
      expect(electronAPI.getPlatform()).toBe("win32");
    });

    it("isNetworkError should identify network errors", () => {
      expect(isNetworkError(new Error("Failed to fetch"))).toBe(true);
      expect(isNetworkError(new Error("Some other error"))).toBe(false);
    });
  });

  describe("windowControls", () => {
    it("minimize should call electron.window.minimize", async () => {
      await electronAPI.windowControls.minimize();
      expect(originalElectron.window.minimize).toHaveBeenCalled();
    });

    it("maximize should call electron.window.maximize", async () => {
      await electronAPI.windowControls.maximize();
      expect(originalElectron.window.maximize).toHaveBeenCalled();
    });

    it("close should call electron.window.close", async () => {
      await electronAPI.windowControls.close();
      expect(originalElectron.window.close).toHaveBeenCalled();
    });
  });

  describe("ipc", () => {
    it("invoke should call electron.ipc.invoke", async () => {
      (originalElectron.ipc.invoke as jest.Mock).mockResolvedValue("result");
      const result = await electronAPI.ipc.invoke("test-channel", "arg1");
      expect(result).toBe("result");
      expect(originalElectron.ipc.invoke).toHaveBeenCalledWith("test-channel", "arg1");
    });

    it("on should call electron.ipc.on", () => {
      const callback = jest.fn();
      electronAPI.ipc.on("test-channel", callback);
      expect(originalElectron.ipc.on).toHaveBeenCalledWith("test-channel", callback);
    });

    it("send should call electron.ipc.send", () => {
      electronAPI.ipc.send("test-channel", "arg1");
      expect(originalElectron.ipc.send).toHaveBeenCalledWith("test-channel", "arg1");
    });
  });

  describe("offline", () => {
    it("getSongs should call electron.offline.getSongs", async () => {
      (originalElectron.offline.getSongs as jest.Mock).mockResolvedValue([]);
      await electronAPI.offline.getSongs();
      expect(originalElectron.offline.getSongs).toHaveBeenCalled();
    });

    it("checkStatus should call electron.offline.checkStatus", async () => {
      await electronAPI.offline.checkStatus("song-1");
      expect(originalElectron.offline.checkStatus).toHaveBeenCalledWith("song-1");
    });
  });

  describe("store", () => {
    it("get should call electron.store.get", async () => {
      await electronAPI.store.get("key");
      expect(originalElectron.store.get).toHaveBeenCalledWith("key");
    });

    it("set should call electron.store.set", async () => {
      await electronAPI.store.set("key", "value");
      expect(originalElectron.store.set).toHaveBeenCalledWith("key", "value");
    });
  });
});
