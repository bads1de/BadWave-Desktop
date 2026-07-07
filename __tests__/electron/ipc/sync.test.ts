import { ipcMain } from "electron";

const capturedInserts: any[] = [];

const mockDb = {
  insert: jest.fn(() => ({
    values: jest.fn((v: any) => {
      capturedInserts.push(v);
      return {
        onConflictDoUpdate: jest.fn(() => ({
          run: jest.fn(() => ({})),
        })),
      };
    }),
  })),
  select: jest.fn(() => ({
    from: jest.fn(() => ({
      where: jest.fn(() => ({ all: jest.fn(() => []) })),
    })),
  })),
  transaction: jest.fn((fn: any) => fn()),
};

jest.mock("electron", () => ({
  ipcMain: {
    handle: jest.fn(),
  },
}));

jest.mock("@/electron/db/client", () => ({
  getDb: jest.fn(() => mockDb),
}));

jest.mock("@/electron/lib/error", () => ({
  getErrorMessage: jest.fn((e: unknown) =>
    e instanceof Error ? e.message : "error",
  ),
}));

jest.mock("@/electron/utils", () => ({
  normalizeId: (id: string) => id,
  toLocalPath: (p: string) => p,
}));

describe("electron/ipc/sync", () => {
  let handlers: Record<string, Function> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    capturedInserts.length = 0;
    handlers = {};
    (ipcMain.handle as jest.Mock).mockImplementation(
      (channel: string, listener: Function) => {
        handlers[channel] = listener;
      },
    );

    jest.isolateModules(() => {
      const { setupSyncHandlers } = require("@/electron/ipc/sync");
      setupSyncHandlers();
    });
  });

  const invoke = async (channel: string, ...args: any[]) => {
    const handler = handlers[channel];
    if (!handler) throw new Error(`No handler registered for ${channel}`);
    return handler({}, ...args);
  };

  describe("sync-playlists", () => {
    it("treats a missing user_id as an empty string, not the string 'undefined'", async () => {
      const result = await invoke("sync-playlists", [
        {
          id: "playlist-1",
          title: "My Playlist",
          is_public: false,
          created_at: "2024-01-01T00:00:00Z",
        },
      ]);

      expect(result.success).toBe(true);
      expect(capturedInserts.length).toBe(1);
      expect(capturedInserts[0][0].userId).toBe("");
      expect(capturedInserts[0][0].userId).not.toBe("undefined");
    });

    it("batches inserts so the SQLite 999-variable limit is never exceeded", async () => {
      const data = Array.from({ length: 200 }, (_, i) => ({
        id: `playlist-${i}`,
        title: `Playlist ${i}`,
        is_public: false,
        created_at: "2024-01-01T00:00:00Z",
      }));

      const result = await invoke("sync-playlists", data);

      expect(result.success).toBe(true);
      // 200 件 / バッチサイズ(50) = 4 回の INSERT に分割されるはず
      expect(capturedInserts.length).toBe(Math.ceil(200 / 50));
      capturedInserts.forEach((batch) =>
        expect(batch.length).toBeLessThanOrEqual(50),
      );
      const total = capturedInserts.reduce((n, b) => n + b.length, 0);
      expect(total).toBe(200);
    });

    it("returns empty success for an empty payload", async () => {
      const result = await invoke("sync-playlists", []);
      expect(result).toEqual({ success: true, count: 0 });
      expect(capturedInserts.length).toBe(0);
    });
  });
});
