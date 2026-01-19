import { ipcMain, app } from "electron";
import { spawn } from "child_process";
import * as fs from "fs";

// Mocks
jest.mock("electron", () => ({
  ipcMain: {
    handle: jest.fn(),
  },
  app: {
    isPackaged: false,
  },
}));

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
}));

jest.mock("path", () => ({
  join: (...args: string[]) => args.join("/"),
}));

describe("IPC: AI", () => {
  let handlers: Record<string, Function> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {};
    (ipcMain.handle as jest.Mock).mockImplementation((channel, listener) => {
      handlers[channel] = listener;
    });

    // モジュールの読み込み
    const { setupAIHandlers } = require("@/electron/ipc/ai");
    setupAIHandlers();
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = handlers[channel];
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({}, ...args);
  };

  describe("ai:generate-lrc", () => {
    it("returns error if python environment is missing", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await invoke("ai:generate-lrc", "test.mp3", "test lyrics");

      expect(result.status).toBe("error");
      expect(result.message).toContain("Python実行環境が見つかりません");
    });

    it("successfully returns LRC from python process", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const mockStdout = JSON.stringify({
        status: "success",
        lrc: "[00:00.00]Test LRC",
      });

      const mockProcess: any = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
      };

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      // Simulate stdout data
      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === "data") {
          callback(Buffer.from(mockStdout));
        }
      });

      // Simulate process close
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === "close") {
          callback(0);
        }
      });

      const result = await invoke("ai:generate-lrc", "test.mp3", "test lyrics");

      expect(result.status).toBe("success");
      expect(result.lrc).toBe("[00:00.00]Test LRC");
      expect(spawn).toHaveBeenCalled();
    });

    it("returns error if python process fails", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const mockProcess: any = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
      };

      (spawn as jest.Mock).mockReturnValue(mockProcess);

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === "data") {
          callback(Buffer.from("Traceback..."));
        }
      });

      mockProcess.on.mockImplementation((event, callback) => {
        if (event === "close") {
          callback(1);
        }
      });

      const result = await invoke("ai:generate-lrc", "test.mp3", "test lyrics");

      expect(result.status).toBe("error");
      expect(result.message).toContain("AIエンジンの実行に失敗しました");
    });
  });
});
