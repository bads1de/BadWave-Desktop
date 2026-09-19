import { setupDownloadHandlers } from "@/electron/ipc/download";
import { ipcMain } from "electron";
import * as fs from "fs";

// Mocks
jest.mock("electron", () => ({
  ipcMain: {
    handle: jest.fn(),
  },
}));

jest.mock("fs", () => {
  const actualFs = jest.requireActual("fs");
  return {
    constants: actualFs.constants,
    promises: {
      access: jest.fn(),
    },
  };
});

describe("IPC: Download", () => {
  let handlers: Record<string, Function> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {};
    (ipcMain.handle as jest.Mock).mockImplementation((channel, listener) => {
      handlers[channel] = listener;
    });
    setupDownloadHandlers();
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = handlers[channel];
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({ sender: { send: jest.fn() } }, ...args);
  };

  describe("check-local-file-exists", () => {
    it("returns true if valid media file exists", async () => {
      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
      const result = await invoke(
        "check-local-file-exists",
        "C:/Users/test/music/song.mp3",
      );
      expect(result).toBe(true);
    });

    it("returns false if file does not exist", async () => {
      (fs.promises.access as jest.Mock).mockRejectedValue(new Error("ENOENT"));
      const result = await invoke(
        "check-local-file-exists",
        "C:/Users/test/music/song.mp3",
      );
      expect(result).toBe(false);
    });

    it("throws error if file contains path traversal", async () => {
      await expect(
        invoke(
          "check-local-file-exists",
          "C:/Users/test/music/../../windows/system32/cmd.exe",
        ),
      ).rejects.toThrow();
    });

    it("throws error if file extension is not allowed", async () => {
      await expect(
        invoke("check-local-file-exists", "C:/Users/test/music/malicious.exe"),
      ).rejects.toThrow();
    });
  });
});
