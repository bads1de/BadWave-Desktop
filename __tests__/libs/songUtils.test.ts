import {
  isLocalSong,
  isLocalFilePath,
  toFileUrl,
  generateLocalSongId,
  extractFilePathFromLocalId,
  getDownloadFilename,
  isValidLocalFilePath,
} from "@/libs/songUtils";
import { Song } from "@/types";

describe("songUtils", () => {
  describe("isLocalSong", () => {
    it("IDが'local_'で始まる場合はtrueを返す", () => {
      const song = { id: "local_abc123" } as Song;
      expect(isLocalSong(song)).toBe(true);
    });

    it("IDが'local_'で始まらない場合はfalseを返す", () => {
      const song = { id: "12345" } as Song;
      expect(isLocalSong(song)).toBe(false);
    });

    it("songがnullやundefinedの場合はfalseを返す", () => {
      expect(isLocalSong(null)).toBe(false);
      expect(isLocalSong(undefined)).toBe(false);
    });
  });

  describe("isLocalFilePath", () => {
    it("httpまたはhttpsで始まる場合はfalseを返す", () => {
      expect(isLocalFilePath("http://example.com/song.mp3")).toBe(false);
      expect(isLocalFilePath("https://example.com/song.mp3")).toBe(false);
    });

    it("file://で始まる場合はtrueを返す", () => {
      expect(isLocalFilePath("file:///C:/path/to/song.mp3")).toBe(true);
    });

    it("Windowsの絶対パスの場合はtrueを返す", () => {
      expect(isLocalFilePath("C:\\path\\to\\song.mp3")).toBe(true);
      expect(isLocalFilePath("D:\\path\\to\\song.mp3")).toBe(true);
    });

    it("Unixの絶対パスの場合はtrueを返す", () => {
      expect(isLocalFilePath("/path/to/song.mp3")).toBe(true);
    });

    it("nullやundefinedの場合はfalseを返す", () => {
      expect(isLocalFilePath(null)).toBe(false);
      expect(isLocalFilePath(undefined)).toBe(false);
    });
  });

  describe("isValidLocalFilePath", () => {
    it("音声ファイルの拡張子は許可する", () => {
      expect(isValidLocalFilePath("C:\\Music\\song.mp3")).toBe(true);
      expect(isValidLocalFilePath("C:\\Music\\song.wav")).toBe(true);
      expect(isValidLocalFilePath("C:\\Music\\song.flac")).toBe(true);
      expect(isValidLocalFilePath("C:\\Music\\song.ogg")).toBe(true);
      expect(isValidLocalFilePath("C:\\Music\\song.m4a")).toBe(true);
    });

    it("ディレクトリトラバーサルを拒否する", () => {
      expect(isValidLocalFilePath("C:\\Music\\..\\Windows\\system32\\file.mp3")).toBe(false);
      expect(isValidLocalFilePath("/music/../../../etc/passwd.mp3")).toBe(false);
    });

    it("許可されない拡張子を拒否する", () => {
      expect(isValidLocalFilePath("C:\\Music\\file.exe")).toBe(false);
      expect(isValidLocalFilePath("C:\\Music\\file.bat")).toBe(false);
      expect(isValidLocalFilePath("C:\\Music\\file.js")).toBe(false);
    });

    it("拡張子なしを拒否する", () => {
      expect(isValidLocalFilePath("C:\\Music\\noext")).toBe(false);
    });
  });

  describe("toFileUrl", () => {
    it("既にbadwave://で始まる場合はそのまま返す", () => {
      const path = "badwave://file/C%3A%2Fpath%2Fsong.mp3";
      expect(toFileUrl(path)).toBe(path);
    });

    it("Windowsパスをbadwave:// URLに変換する", () => {
      expect(toFileUrl("C:\\path\\song.mp3")).toBe("badwave://file/C%3A%5Cpath%5Csong.mp3");
    });

    it("Unixパスをbadwave:// URLに変換する", () => {
      expect(toFileUrl("/path/song.mp3")).toBe("badwave://file/%2Fpath%2Fsong.mp3");
    });
  });

  describe("generateLocalSongId と extractFilePathFromLocalId", () => {
    it("パスからIDを生成し、IDからパスを復元できる", () => {
      const path = "C:\\Users\\Music\\song.mp3";
      const id = generateLocalSongId(path);
      expect(id).toMatch(/^local_/);
      expect(extractFilePathFromLocalId(id)).toBe(path);
    });

    it("不正な形式のIDの場合はnullを返す", () => {
      expect(extractFilePathFromLocalId("notlocal_123")).toBe(null);
      expect(extractFilePathFromLocalId("local_!!!")).toBe(null); // 不正なbase64
    });
  });

  describe("getDownloadFilename", () => {
    it("曲のタイトルとIDからファイル名を生成する", () => {
      const song = { id: "123", title: "My Song" } as Song;
      expect(getDownloadFilename(song)).toBe("My Song-123.mp3");
    });

    it("ファイル名に使用できない文字を除去する", () => {
      const song = { id: "123", title: 'Song <script> "title" / \ | ? *' } as Song;
      expect(getDownloadFilename(song)).toBe("Song script title-123.mp3");
    });
  });
});
