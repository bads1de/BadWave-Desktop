/**
 * @jest-environment jsdom
 */
import { dev } from "@/libs/electron/dev";

/**
 * Electron ブリッジを設定する。
 * isElectron() は window.electron.appInfo.isElectron を参照するため、
 * appInfo を含めて差し替える必要がある。
 */
const setupElectronBridge = (devBridge: Record<string, jest.Mock>) => {
  (window as any).electron = {
    appInfo: { isElectron: true },
    dev: devBridge,
  };
};

describe("electron/dev", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 既定はブラウザ環境（Electron ブリッジなし）
    delete (window as any).electron;
  });

  describe("toggleOfflineSimulation", () => {
    it("should call electron dev toggle when in Electron", async () => {
      const toggleOfflineSimulation = jest
        .fn()
        .mockResolvedValue({ isOffline: true });
      setupElectronBridge({ toggleOfflineSimulation });

      const result = await dev.toggleOfflineSimulation();
      expect(result).toEqual({ isOffline: true });
      expect(toggleOfflineSimulation).toHaveBeenCalled();
    });

    it("should return isOffline: false when not in Electron", async () => {
      const result = await dev.toggleOfflineSimulation();
      expect(result).toEqual({ isOffline: false });
    });
  });

  describe("getOfflineSimulationStatus", () => {
    it("should call electron dev status when in Electron", async () => {
      const getOfflineSimulationStatus = jest
        .fn()
        .mockResolvedValue({ isOffline: false });
      setupElectronBridge({ getOfflineSimulationStatus });

      const result = await dev.getOfflineSimulationStatus();
      expect(result).toEqual({ isOffline: false });
      expect(getOfflineSimulationStatus).toHaveBeenCalled();
    });

    it("should return isOffline: false when not in Electron", async () => {
      const result = await dev.getOfflineSimulationStatus();
      expect(result).toEqual({ isOffline: false });
    });
  });

  describe("setOfflineSimulation", () => {
    it("should call electron dev set when in Electron", async () => {
      const setOfflineSimulation = jest
        .fn()
        .mockResolvedValue({ isOffline: true });
      setupElectronBridge({ setOfflineSimulation });

      const result = await dev.setOfflineSimulation(true);
      expect(result).toEqual({ isOffline: true });
      expect(setOfflineSimulation).toHaveBeenCalledWith(true);
    });

    it("should return isOffline: false when not in Electron", async () => {
      const result = await dev.setOfflineSimulation(true);
      expect(result).toEqual({ isOffline: false });
    });
  });
});
