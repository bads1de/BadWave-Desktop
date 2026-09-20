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

jest.mock("path", () => {
  const actual = jest.requireActual("path");
  return {
    ...actual,
    join: (...args: string[]) => args.join("/"),
  };
});

describe("IPC: Transcribe", () => {
  let handlers: Record<string, Function> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {};
    (ipcMain.handle as jest.Mock).mockImplementation((channel, listener) => {
      handlers[channel] = listener;
    });

    // モジュールの読み込み
    const { setupTranscriptionHandlers } = require("@/electron/ipc/transcribe");
    setupTranscriptionHandlers();
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = handlers[channel];
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({}, ...args);
  };

  describe("transcribe:generate-lrc", () => {
    it("returns error if python environment is missing", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await invoke(
        "transcribe:generate-lrc",
        "test.mp3",
        "test lyrics",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Python実行環境が見つかりません");
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
      mockProcess.stdout.on.mockImplementation(
        (event: string, callback: Function) => {
          if (event === "data") {
            callback(Buffer.from(mockStdout));
          }
        },
      );

      // Simulate process close
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === "close") {
          callback(0);
        }
      });

      const result = await invoke(
        "transcribe:generate-lrc",
        "test.mp3",
        "test lyrics",
      );

      expect(result.success).toBe(true);
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

      mockProcess.stderr.on.mockImplementation(
        (event: string, callback: Function) => {
          if (event === "data") {
            callback(Buffer.from("Traceback..."));
          }
        },
      );

      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === "close") {
          callback(1);
        }
      });

      const result = await invoke(
        "transcribe:generate-lrc",
        "test.mp3",
        "test lyrics",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "トランスクライブエンジンの実行に失敗しました",
      );
    });

    it("python の起動に失敗した場合は reject せずエラーを返す", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const mockProcess: any = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
      };
      (spawn as jest.Mock).mockReturnValue(mockProcess);

      // spawn 失敗時は 'error' が発火し、'close' は来ない
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === "error") {
          callback(new Error("EACCES: permission denied"));
        }
      });

      const result = await invoke(
        "transcribe:generate-lrc",
        "test.mp3",
        "test lyrics",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "トランスクライブエンジンの起動に失敗しました",
      );
    });

    it("returns an error object (not a rejection) on invalid input", async () => {
      // 空文字列は audioPathSchema (min(1)) を満たさないためバリデーションエラーになる。
      // Promise が { success: false, error } で resolve されること。
      const result = await invoke("transcribe:generate-lrc", "", "test lyrics");
      expect(result.success).toBe(false);
      expect(typeof result.error).toBe("string");
    });

    it("throws error if audioPath contains path traversal", async () => {
      await expect(
        invoke("transcribe:generate-lrc", "C:/Users/test/music/../../windows/system32/cmd.exe", "test lyrics")
      ).rejects.toThrow();
    });

    it("throws error if audioPath has unsupported extension", async () => {
      await expect(
        invoke("transcribe:generate-lrc", "C:/Users/test/music/malicious.exe", "test lyrics")
      ).rejects.toThrow();
    });
  });
});
