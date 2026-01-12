import { ipcMain } from "electron";

// Mocks
jest.mock("electron", () => ({
  ipcMain: {
    handle: jest.fn(),
  },
  session: {
    defaultSession: {
      enableNetworkEmulation: jest.fn(),
    },
  },
}));

const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
};

// モックのパス解決を確実にする
jest.mock("@/electron/lib/store", () => mockStore, { virtual: true });

jest.mock("@/electron/utils", () => ({
  debugLog: jest.fn(),
}));

describe("IPC: Settings", () => {
  let handlers: Record<string, Function> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {};
    (ipcMain.handle as jest.Mock).mockImplementation((channel, listener) => {
      handlers[channel] = listener;
    });
    
    jest.isolateModules(() => {
        const { setupSettingsHandlers, setIsSimulatingOffline } = require("@/electron/ipc/settings");
        setIsSimulatingOffline(false);
        setupSettingsHandlers();
    });
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = handlers[channel];
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({}, ...args);
  };

  describe("Store operations", () => {
    it("gets store value", async () => {
      mockStore.get.mockReturnValue("some-value");
      const result = await invoke("get-store-value", "key");
      
      expect(mockStore.get).toHaveBeenCalledWith("key");
      expect(result).toBe("some-value");
    });

    it("sets store value", async () => {
      await invoke("set-store-value", "key", "value");
      expect(mockStore.set).toHaveBeenCalledWith("key", "value");
    });
  });

  describe("Offline simulation", () => {
    it("toggles offline simulation", async () => {
      // Initial: false -> true
      let result = await invoke("toggle-offline-simulation");
      expect(result).toEqual({ isOffline: true });
      expect(require("electron").session.defaultSession.enableNetworkEmulation).toHaveBeenCalledWith({
        offline: true,
      });

      // true -> false
      result = await invoke("toggle-offline-simulation");
      expect(result).toEqual({ isOffline: false });
      expect(require("electron").session.defaultSession.enableNetworkEmulation).toHaveBeenCalledWith({
        offline: false,
      });
    });

    it("sets offline simulation explicitly", async () => {
      const result = await invoke("set-offline-simulation", true);
      expect(result).toEqual({ isOffline: true });
      expect(require("electron").session.defaultSession.enableNetworkEmulation).toHaveBeenCalledWith({
        offline: true,
      });
    });
  });
});
