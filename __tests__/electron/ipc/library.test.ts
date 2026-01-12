import { ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as mm from "music-metadata";

// Mocks
jest.mock("electron", () => ({
  ipcMain: {
    handle: jest.fn(),
  },
}));

const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
};
jest.mock("@/electron/lib/store", () => mockStore);

jest.mock("fs", () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
    access: jest.fn(),
  },
}));

jest.mock("path", () => ({
  join: (...args: string[]) => args.join("/"),
  extname: (file: string) => {
    const parts = file.split(".");
    return parts.length > 1 ? "." + parts[parts.length - 1] : "";
  },
  basename: (file: string) => file.split("/").pop() || file,
}));

jest.mock("music-metadata", () => ({
  parseFile: jest.fn(),
}));

jest.mock("@/electron/utils", () => ({
  debugLog: jest.fn(),
}));

jest.mock("@/electron/lib/window-manager", () => ({
  getMainWindow: jest.fn().mockReturnValue({
    isDestroyed: () => false,
    webContents: {
      send: jest.fn(),
    },
  }),
}));

describe("IPC: Library", () => {
  let handlers: Record<string, Function> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {};
    (ipcMain.handle as jest.Mock).mockImplementation((channel, listener) => {
      handlers[channel] = listener;
    });
    
    jest.isolateModules(() => {
        const { setupLibraryHandlers } = require("@/electron/ipc/library");
        setupLibraryHandlers();
    });
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = handlers[channel];
    if (!handler) {
      throw new Error(`No handler registered for ${channel}`);
    }
    return handler({}, ...args);
  };

  describe("handle-scan-mp3-files", () => {
    it("scans directory for mp3 files", async () => {
      const mockDir = "/music";
      const mockFiles = [
        { name: "song1.mp3", isDirectory: () => false, isFile: () => true },
        { name: "image.jpg", isDirectory: () => false, isFile: () => true },
        { name: "subdir", isDirectory: () => true, isFile: () => false },
      ];
      const mockSubFiles = [
        { name: "song2.mp3", isDirectory: () => false, isFile: () => true },
      ];

      (fs.promises.readdir as jest.Mock).mockImplementation(async (dir) => {
        if (dir === mockDir) return mockFiles;
        if (dir === mockDir + "/subdir") return mockSubFiles;
        return [];
      });

      (fs.promises.stat as jest.Mock).mockResolvedValue({ mtimeMs: 1000 });
      mockStore.get.mockReturnValue(null); // No saved library

      const result = await invoke("handle-scan-mp3-files", mockDir);

      expect(result.files).toHaveLength(2);
      expect(result.files).toContain("/music/song1.mp3");
      expect(result.files).toContain("/music/subdir/song2.mp3");
      
      expect(mockStore.set).toHaveBeenCalled();
    });
  });

  describe("handle-get-mp3-metadata", () => {
    it("parses metadata from file", async () => {
      const filePath = "/music/song1.mp3";
      const mockMetadata = { common: { title: "Test Song" } };
      
      (fs.promises.stat as jest.Mock).mockResolvedValue({ mtimeMs: 1000 });
      mockStore.get.mockReturnValue(null);
      (mm.parseFile as jest.Mock).mockResolvedValue(mockMetadata);

      const result = await invoke("handle-get-mp3-metadata", filePath);

      expect(result.metadata).toEqual(mockMetadata);
      expect(result.fromCache).toBe(false);
      expect(mm.parseFile).toHaveBeenCalledWith(filePath);
    });

    it("returns cached metadata if file not modified", async () => {
      const filePath = "/music/song1.mp3";
      const mockMetadata = { common: { title: "Test Song" } };
      
      (fs.promises.stat as jest.Mock).mockResolvedValue({ mtimeMs: 1000 });
      mockStore.get.mockReturnValue({
        files: {
          [filePath]: {
            metadata: mockMetadata,
            lastModified: 1000,
          },
        },
      });

      const result = await invoke("handle-get-mp3-metadata", filePath);

      expect(result.metadata).toEqual(mockMetadata);
      expect(result.fromCache).toBe(true);
      expect(mm.parseFile).not.toHaveBeenCalled();
    });
  });
});
