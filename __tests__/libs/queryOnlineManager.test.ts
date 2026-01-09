/**
 * @jest-environment jsdom
 */
import { onlineManager, focusManager } from "@tanstack/react-query";
import { setupOnlineManager, setupFocusManager } from "@/libs/queryOnlineManager";

// electron API のモック (setup.ts で設定されているが、ここでも明示)
if (typeof window !== "undefined" && !window.electron) {
  (window as any).electron = {
    appInfo: { isElectron: true },
    dev: { getOfflineSimulationStatus: jest.fn().mockResolvedValue({ isOffline: false }) },
    ipc: { on: jest.fn().mockReturnValue(() => {}) }
  };
}

describe("libs/queryOnlineManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("setupOnlineManager", () => {
    it("onlineManager のイベントリスナーを設定すること", () => {
      const spy = jest.spyOn(onlineManager, "setEventListener");
      setupOnlineManager();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("setupFocusManager", () => {
    it("Electron環境の場合、focusManager のイベントリスナーを設定すること", () => {
      if (window.electron) {
        window.electron.appInfo.isElectron = true;
      }

      const spy = jest.spyOn(focusManager, "setEventListener");
      setupFocusManager();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("Web環境の場合、何も設定しないこと", () => {
      if (window.electron) {
        window.electron.appInfo.isElectron = false;
      }

      const spy = jest.spyOn(focusManager, "setEventListener");
      setupFocusManager();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});