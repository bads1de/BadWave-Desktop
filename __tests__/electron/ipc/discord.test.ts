import { ipcMain } from "electron";
import { setupDiscordHandlers } from "@/electron/ipc/discord";

jest.mock("electron", () => ({
  ipcMain: {
    handle: jest.fn(),
  },
}));

let readyCallback: Function | null = null;

const mockClient = {
  once: jest.fn().mockImplementation((event: string, cb: Function) => {
    if (event === "ready") readyCallback = cb;
  }),
  login: jest.fn(),
  setActivity: jest.fn(),
  clearActivity: jest.fn(),
};

jest.mock("discord-rpc", () => ({
  Client: jest.fn(() => mockClient),
}));

describe("electron/ipc/discord", () => {
  let handlers: Record<string, Function> = {};

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = handlers[channel];
    if (!handler) throw new Error(`No handler registered for ${channel}`);
    return handler({}, ...args);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    readyCallback = null;
    handlers = {};
    (ipcMain.handle as jest.Mock).mockImplementation(
      (channel: string, listener: Function) => {
        handlers[channel] = listener;
      },
    );
    mockClient.once.mockImplementation((event: string, cb: Function) => {
      if (event === "ready") readyCallback = cb;
    });
  });

  describe("discord:set-activity", () => {
    it("should return success when activity is set", async () => {
      mockClient.login.mockImplementation(async () => {
        if (readyCallback) readyCallback();
      });
      mockClient.setActivity.mockResolvedValue(undefined);

      setupDiscordHandlers();

      const result = await invoke("discord:set-activity", {
        details: "Playing a song",
      });

      expect(mockClient.setActivity).toHaveBeenCalledWith({
        details: "Playing a song",
      });
      expect(result).toEqual({ success: true });
    });

    it("should return error when setActivity fails", async () => {
      mockClient.login.mockImplementation(async () => {
        if (readyCallback) readyCallback();
      });
      mockClient.setActivity.mockRejectedValue(new Error("RPC error"));

      setupDiscordHandlers();

      const result = await invoke("discord:set-activity", {
        details: "Playing",
      });

      expect(result.success).toBe(false);
    });

    it("should return error when Discord is not running", async () => {
      mockClient.login.mockRejectedValue(new Error("Discord not running"));

      setupDiscordHandlers();

      const result = await invoke("discord:set-activity", {
        details: "Playing",
      });

      expect(result).toEqual({
        success: false,
        error: "Failed to connect to Discord",
      });
    });
  });

  describe("discord:clear-activity", () => {
    it("should call clearActivity when rpc is connected", async () => {
      mockClient.login.mockImplementation(async () => {
        if (readyCallback) readyCallback();
      });
      mockClient.clearActivity.mockResolvedValue(undefined);

      setupDiscordHandlers();

      await invoke("discord:clear-activity");

      expect(mockClient.clearActivity).toHaveBeenCalled();
    });

    it("should not throw when rpc is not connected", async () => {
      mockClient.login.mockRejectedValue(new Error("Discord not running"));

      setupDiscordHandlers();

      const result = await invoke("discord:clear-activity");

      expect(result).toBeUndefined();
    });
  });
});
