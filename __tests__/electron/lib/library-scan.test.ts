import * as fs from "fs";
import * as path from "path";
import { scanMusicLibrary } from "@/electron/lib/library-scan";
import type { MusicLibrary } from "@/types/local";

jest.mock("fs", () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
    realpath: jest.fn((p: string) => Promise.resolve(p)),
  },
}));

// Dirent ライクなエントリを生成するヘルパー
const file = (name: string) => ({
  name,
  isDirectory: () => false,
  isFile: () => true,
});
const folder = (name: string) => ({
  name,
  isDirectory: () => true,
  isFile: () => false,
});

describe("electron/lib/library-scan", () => {
  const dir = path.join("/music");

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.promises.realpath as jest.Mock).mockImplementation((p: string) =>
      Promise.resolve(p),
    );
  });

  it("初回（完全）スキャンでは全音声ファイルを newFiles に分類する", async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([
      file("a.mp3"),
      file("b.wav"),
      file("image.jpg"), // 音声ではないため対象外
      file("notes.txt"), // 対象外
    ]);
    (fs.promises.stat as jest.Mock).mockResolvedValue({ mtimeMs: 1000 });

    const result = await scanMusicLibrary(dir, undefined);

    expect(result.files).toEqual([
      path.join(dir, "a.mp3"),
      path.join(dir, "b.wav"),
    ]);
    expect(result.scanInfo.isSameDirectory).toBe(false);
    expect(result.scanInfo.isFullScan).toBe(true);
    expect(result.scanInfo.newFiles).toEqual(result.files);
    expect(result.scanInfo.modifiedFiles).toEqual([]);
    expect(result.scanInfo.unchangedFiles).toEqual([]);
    expect(result.scanInfo.deletedFiles).toEqual([]);
    // メタデータは未取得なので needsMetadata はすべて true
    expect(result.filesWithMetadata.every((f) => f.needsMetadata)).toBe(true);
    expect(result.filesWithMetadata.map((f) => f.metadata)).toEqual([
      null,
      null,
    ]);
  });

  it("同一ディレクトリの差分スキャンで new / modified / unchanged / deleted を分類する", async () => {
    const a = path.join(dir, "a.mp3");
    const b = path.join(dir, "b.mp3");
    const c = path.join(dir, "c.mp3");
    const deleted = path.join(dir, "deleted.mp3");

    const prev: MusicLibrary = {
      directoryPath: dir,
      files: {
        [a]: { lastModified: 1000, metadata: { common: { title: "A" } } },
        [c]: { lastModified: 1000 },
        [deleted]: { lastModified: 1000 },
      },
    };

    (fs.promises.readdir as jest.Mock).mockResolvedValue([
      file("a.mp3"),
      file("b.mp3"),
      file("c.mp3"),
    ]);
    (fs.promises.stat as jest.Mock).mockImplementation(async (p: string) => ({
      mtimeMs: p.endsWith("c.mp3") ? 2000 : 1000,
    }));

    const result = await scanMusicLibrary(dir, prev);

    expect(result.scanInfo.isSameDirectory).toBe(true);
    expect(result.scanInfo.isFullScan).toBe(false);
    expect(result.scanInfo.newFiles).toEqual([b]);
    expect(result.scanInfo.modifiedFiles).toEqual([c]);
    expect(result.scanInfo.unchangedFiles).toEqual([a]);
    expect(result.scanInfo.deletedFiles).toEqual([deleted]);
    // 変更なしは前回のメタデータをそのまま再利用する
    expect(result.currentLibrary.files[a]).toEqual(prev.files[a]);
    // 変更ありはメタデータを破棄して再取得対象にする
    expect(result.currentLibrary.files[c]).toEqual({ lastModified: 2000 });
    expect(result.filesWithMetadata.find((f) => f.path === c)?.needsMetadata).toBe(
      true,
    );
  });

  it("forceFullScan では差分スキャンを行わない", async () => {
    const a = path.join(dir, "a.mp3");
    const prev: MusicLibrary = {
      directoryPath: dir,
      files: { [a]: { lastModified: 1000, metadata: { common: {} } } },
    };
    (fs.promises.readdir as jest.Mock).mockResolvedValue([file("a.mp3")]);
    (fs.promises.stat as jest.Mock).mockResolvedValue({ mtimeMs: 1000 });

    const result = await scanMusicLibrary(dir, prev, { forceFullScan: true });

    expect(result.scanInfo.isFullScan).toBe(true);
    expect(result.scanInfo.newFiles).toEqual([a]);
    expect(result.scanInfo.deletedFiles).toEqual([]);
  });

  it("別ディレクトリは差分スキャンせず完全スキャン扱いにする", async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([file("a.mp3")]);
    (fs.promises.stat as jest.Mock).mockResolvedValue({ mtimeMs: 1000 });

    const prev: MusicLibrary = {
      directoryPath: "/other",
      files: { "/other/x.mp3": { lastModified: 1 } },
    };
    const result = await scanMusicLibrary(dir, prev);

    expect(result.scanInfo.isSameDirectory).toBe(false);
    expect(result.scanInfo.isFullScan).toBe(true);
    expect(result.scanInfo.deletedFiles).toEqual([]);
  });

  it("シンボリックリンクの循環があっても無限ループしない", async () => {
    const dirA = path.join("/music/dirA");
    const dirB = path.join(dirA, "dirB");

    (fs.promises.readdir as jest.Mock).mockImplementation(async (d: string) => {
      if (d === dirA) return [file("song.mp3"), folder("dirB")];
      if (d === dirB) return [folder("dirA")];
      return [];
    });
    // dirB/dirA を dirA に解決させて循環を作る
    (fs.promises.realpath as jest.Mock).mockImplementation(async (p: string) => {
      if (p.endsWith("dirB/dirA") || p.endsWith("dirB\\dirA")) return dirA;
      return p;
    });
    (fs.promises.stat as jest.Mock).mockResolvedValue({ mtimeMs: 1000 });

    const result = await scanMusicLibrary(dirA, undefined);

    expect(result.files).toEqual([path.join(dirA, "song.mp3")]);
  });

  it("進捗は scanning → analyzing の順で通知し complete は通知しない", async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([file("a.mp3")]);
    (fs.promises.stat as jest.Mock).mockResolvedValue({ mtimeMs: 1 });

    const phases: string[] = [];
    await scanMusicLibrary(dir, undefined, {
      onProgress: (p) => phases.push(p.phase),
    });

    expect(phases[0]).toBe("scanning");
    expect(phases).toContain("analyzing");
    expect(phases).not.toContain("complete");
  });
});
