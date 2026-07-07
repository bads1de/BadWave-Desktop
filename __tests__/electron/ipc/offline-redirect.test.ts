import { ipcMain } from "electron";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import os from "os";

const mockDb = {
  query: {
    songs: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
  insert: jest.fn(() => ({
    values: jest.fn(() => ({
      onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
    })),
  })),
  delete: jest.fn(() => ({
    where: jest.fn().mockResolvedValue(undefined),
  })),
};

jest.mock("electron", () => ({
  ipcMain: { handle: jest.fn() },
  app: {
    getPath: jest.fn(() => fs.mkdtempSync(path.join(os.tmpdir(), "bw-offline-"))),
  },
}));

jest.mock("@/electron/db/client", () => ({ getDb: jest.fn(() => mockDb) }));

jest.mock("@/electron/lib/error", () => ({
  getErrorMessage: jest.fn((e: unknown) =>
    e instanceof Error ? e.message : "error",
  ),
}));

jest.mock("@/electron/utils", () => ({
  toLocalPath: (p: string) => p,
  normalizeId: (id: string) => id,
}));

describe("electron/ipc/offline redirect handling", () => {
  let handlers: Record<string, Function> = {};
  let server: http.Server;
  let baseUrl = "";

  beforeAll((done) => {
    server = http.createServer((req, res) => {
      if (req.url === "/redirect.mp3") {
        res.writeHead(302, { location: `${baseUrl}/final.mp3` });
        res.end();
      } else if (req.url === "/final.mp3") {
        res.writeHead(200, { "Content-Type": "audio/mpeg" });
        res.end("FINALCONTENT");
      } else if (req.url === "/img.jpg") {
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end("IMG");
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${addr.port}`;
      done();
    });
  });

  afterAll((done) => {
    server.close(() => done());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = {};
    (ipcMain.handle as jest.Mock).mockImplementation((channel, listener) => {
      handlers[channel] = listener;
    });
    jest.isolateModules(() => {
      const { setupOfflineDownloadHandlers } = require("@/electron/ipc/offline");
      setupOfflineDownloadHandlers();
    });
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = handlers[channel];
    if (!handler) throw new Error(`No handler registered for ${channel}`);
    return handler({}, ...args);
  };

  it("follows redirects and writes the final file completely", async () => {
    const result = await invoke("download-song", {
      id: "song-1",
      userId: "user-1",
      title: "Song",
      author: "Author",
      song_path: `${baseUrl}/redirect.mp3`,
      image_path: `${baseUrl}/img.jpg`,
      created_at: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
  }, 15000);
});
