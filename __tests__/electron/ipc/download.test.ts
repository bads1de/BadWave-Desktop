import { setupDownloadHandlers } from "@/electron/ipc/download";
import { ipcMain } from "electron";
import * as fs from "fs";
import * as https from "https";
import { EventEmitter } from "events";

// Mocks
jest.mock("electron", () => ({
  ipcMain: {
    handle: jest.fn(),
  },
  app: {
    getPath: jest.fn().mockReturnValue("/mock/userData"),
  },
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  createWriteStream: jest.fn(),
  unlink: jest.fn((path, cb: any) => cb()),
  promises: {
    mkdir: jest.fn(),
    access: jest.fn(),
    unlink: jest.fn(),
  },
}));

jest.mock("https", () => ({
  get: jest.fn(),
}));

jest.mock("path", () => ({
  join: (...args: string[]) => args.join("/"),
}));

jest.mock("@/electron/utils", () => ({
  debugLog: jest.fn(),
}));

describe("IPC: Download", () => {
  let handlers: Record<string, Function> = {};
  const mockSender = { send: jest.fn() };

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
    // event object with sender
    return handler({ sender: mockSender }, ...args);
  };

  describe("download-song-simple", () => {
    it("downloads file successfully", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true); // skip mkdir

      const mockWriteStream = {
        on: jest.fn(),
        close: jest.fn((cb) => cb()),
      };
      (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);

      const mockResponse = new EventEmitter() as any;
      mockResponse.statusCode = 200;
      mockResponse.headers = { "content-length": "100" };
      mockResponse.pipe = jest.fn();

      const mockRequest = new EventEmitter();
      (https.get as jest.Mock).mockImplementation((url, cb) => {
        cb(mockResponse);
        return mockRequest;
      });

      // Invoke handler
      const downloadPromise = invoke(
        "download-song-simple",
        "http://example.com/song.mp3",
        "song.mp3",
      );

      // Simulate response data flow
      mockResponse.emit("data", Buffer.alloc(50)); // 50%
      mockResponse.emit("data", Buffer.alloc(50)); // 100%

      // Simulate file finish
      const finishHandler = mockWriteStream.on.mock.calls.find(
        (call: any) => call[0] === "finish",
      )[1];
      finishHandler();

      const result = await downloadPromise;

      expect(result).toBe("/mock/userData/downloads/song.mp3");
      expect(mockSender.send).toHaveBeenCalledWith("download-progress", 50);
      expect(mockSender.send).toHaveBeenCalledWith("download-progress", 100);
    });

    it("handles download error (status code)", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.createWriteStream as jest.Mock).mockReturnValue({
        on: jest.fn(),
        close: jest.fn(),
      });

      (https.get as jest.Mock).mockImplementation((url, cb) => {
        const mockResponse = new EventEmitter() as any;
        mockResponse.statusCode = 404;
        cb(mockResponse);
        return new EventEmitter();
      });

      await expect(
        invoke("download-song-simple", "http://example.com/404.mp3", "404.mp3"),
      ).rejects.toThrow("Status Code: 404");

      expect(fs.unlink).toHaveBeenCalled();
    });
  });

  describe("check-file-exists", () => {
    it("returns true if file exists", async () => {
      (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
      const result = await invoke("check-file-exists", "song.mp3");
      expect(result).toBe(true);
    });

    it("returns false if file does not exist", async () => {
      (fs.promises.access as jest.Mock).mockRejectedValue(new Error("ENOENT"));
      const result = await invoke("check-file-exists", "song.mp3");
      expect(result).toBe(false);
    });
  });

  describe("delete-song", () => {
    it("returns true on success", async () => {
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
      const result = await invoke("delete-song", "song.mp3");
      expect(result).toBe(true);
    });

    it("returns false on error", async () => {
      (fs.promises.unlink as jest.Mock).mockRejectedValue(new Error("Error"));
      const result = await invoke("delete-song", "song.mp3");
      expect(result).toBe(false);
    });
  });
});
