import { ipcMain } from "electron";

// Mocks
jest.mock("electron", () => ({
  ipcMain: {
    handle: jest.fn(),
  },
}));

const mockStoreInstance = {
  set: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
};

jest.mock("electron-store", () => {
  return jest.fn().mockImplementation(() => mockStoreInstance);
});

describe("IPC: Auth", () => {
  let handlers: Record<string, Function> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {};
    (ipcMain.handle as jest.Mock).mockImplementation((channel, listener) => {
      handlers[channel] = listener;
    });

    // モジュールを再読み込みして、新しいStoreインスタンス（モック）を作成させる
    jest.isolateModules(() => {
      const { setupAuthHandlers } = require("@/electron/ipc/auth");
      setupAuthHandlers();
    });
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = handlers[channel];
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({}, ...args);
  };

  it("registers handlers", () => {
    expect(handlers["save-cached-user"]).toBeDefined();
    expect(handlers["get-cached-user"]).toBeDefined();
    expect(handlers["clear-cached-user"]).toBeDefined();
  });

  describe("save-cached-user", () => {
    it("saves user to store", async () => {
      const user = { id: "123", email: "test@example.com" };
      const result = await invoke("save-cached-user", user);

      expect(mockStoreInstance.set).toHaveBeenCalledWith("cachedUser", user);
      expect(result).toEqual({ success: true });
    });

    it("handles errors", async () => {
      mockStoreInstance.set.mockImplementation(() => {
        throw new Error("Store error");
      });

      const result = await invoke("save-cached-user", { id: "1" });
      expect(result).toEqual({ success: false, error: "Store error" });
    });
  });

  describe("get-cached-user", () => {
    it("retrieves user from store", async () => {
      const user = { id: "123" };
      mockStoreInstance.get.mockReturnValue(user);

      const result = await invoke("get-cached-user");
      expect(mockStoreInstance.get).toHaveBeenCalledWith("cachedUser", null);
      expect(result).toEqual(user);
    });
  });

  describe("clear-cached-user", () => {
    it("deletes user from store", async () => {
      const result = await invoke("clear-cached-user");
      expect(mockStoreInstance.delete).toHaveBeenCalledWith("cachedUser");
      expect(result).toEqual({ success: true });
    });
  });
});
