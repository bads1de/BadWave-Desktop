import { mapFileToSong } from "@/libs/localFileMappers";
import { LocalFile } from "@/app/local/page";
import { generateLocalSongId } from "@/libs/songUtils";

// generateLocalSongId は内部で btoa を使用しているため、
// 環境によってはポリフィルが必要ですが、__tests__/setup.ts で設定されています。

describe("libs/localFileMappers", () => {
  describe("mapFileToSong", () => {
    it("すべてのメタデータが存在する場合、正しくSongオブジェクトに変換されること", () => {
      const mockFile: LocalFile = {
        path: "C:\\Music\\TestSong.mp3",
        metadata: {
          common: {
            title: "Test Title",
            artist: "Test Artist",
            album: "Test Album",
            genre: ["Test Genre"],
          },
          format: {
            duration: 180, // 3 minutes
          },
        },
      };

      const result = mapFileToSong(mockFile);

      expect(result).toEqual({
        id: generateLocalSongId(mockFile.path),
        user_id: "local_user",
        author: "Test Artist",
        title: "Test Title",
        song_path: "C:\\Music\\TestSong.mp3",
        image_path: "",
        video_path: "",
        genre: "Test Genre",
        duration: 180,
        created_at: expect.any(String), // 日時は動的
        public: false,
      });

      // 日時の形式確認 (ISO string)
      expect(new Date(result.created_at).toISOString()).toBe(result.created_at);
    });

    it("メタデータが欠落している場合、ファイル名からタイトルを推論すること (Windowsパス)", () => {
      const mockFile: LocalFile = {
        path: "C:\\Music\\UnknownSong.mp3",
        metadata: {
          common: {},
          format: {},
        },
      };

      const result = mapFileToSong(mockFile);

      expect(result.title).toBe("UnknownSong.mp3");
      expect(result.author).toBe("不明なアーティスト");
      expect(result.genre).toBe("");
      expect(result.duration).toBe(0);
    });

    it("メタデータが欠落している場合、ファイル名からタイトルを推論すること (Unixパス)", () => {
      const mockFile: LocalFile = {
        path: "/home/user/music/UnixSong.mp3",
        metadata: undefined,
      };

      const result = mapFileToSong(mockFile);

      expect(result.title).toBe("UnixSong.mp3");
    });

    it("パスが存在しない場合（稀なケース）、タイトルはデフォルト値になること", () => {
      const mockFile: LocalFile = {
        path: "",
        metadata: undefined,
      };

      const result = mapFileToSong(mockFile);

      expect(result.title).toBe("不明なタイトル");
    });

    it("ID生成が一貫していること", () => {
      const path = "C:\\Music\\Consistent.mp3";
      const file1: LocalFile = { path, metadata: {} };
      const file2: LocalFile = { path, metadata: {} };

      const result1 = mapFileToSong(file1);
      const result2 = mapFileToSong(file2);

      expect(result1.id).toBe(result2.id);
      expect(result1.id).toMatch(/^local_/);
    });
  });
});
