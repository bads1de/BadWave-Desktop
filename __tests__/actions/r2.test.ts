/**
 * @jest-environment node
 */
import { uploadFileToR2, deleteFileFromR2 } from "@/actions/r2";
import { requireAdmin } from "@/libs/admin";

jest.mock("@/libs/admin");
jest.mock("@/libs/s3", () => ({
  __esModule: true,
  default: {
    send: jest.fn(),
  },
}));
jest.mock("@/libs/utils", () => ({
  sanitizeTitle: jest.fn((title: string) => title),
}));

describe("r2 actions", () => {
  const mockFile = new File(["test content"], "test.mp3", { type: "audio/mpeg" });

  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue(undefined);
  });

  describe("uploadFileToR2", () => {
    it("should return error when admin check fails", async () => {
      (requireAdmin as jest.Mock).mockRejectedValue(new Error("管理者権限が必要です"));

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("bucketName", "song");

      const result = await uploadFileToR2(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return error when file is missing", async () => {
      const formData = new FormData();
      formData.append("bucketName", "song");

      const result = await uploadFileToR2(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("ファイルとバケット名は必須です");
    });

    it("should return error when bucketName is missing", async () => {
      const formData = new FormData();
      formData.append("file", mockFile);

      const result = await uploadFileToR2(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("ファイルとバケット名は必須です");
    });

    it("should return error for invalid bucket name", async () => {
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("bucketName", "invalid-bucket");

      const result = await uploadFileToR2(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("不正なバケット名です");
    });

    it("should successfully upload file to R2", async () => {
      const { default: s3Client } = require("@/libs/s3");
      s3Client.send.mockResolvedValue({});

      process.env.R2_SONG_URL = "https://r2.example.com/songs";

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("bucketName", "song");

      const result = await uploadFileToR2(formData);
      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.url).toContain("r2.example.com");
    });
  });

  describe("deleteFileFromR2", () => {
    it("should return error when admin check fails", async () => {
      (requireAdmin as jest.Mock).mockRejectedValue(new Error("管理者権限が必要です"));

      const result = await deleteFileFromR2("song", "test.mp3");
      expect(result.success).toBe(false);
    });

    it("should return error when params are missing", async () => {
      const result = await deleteFileFromR2("" as any, "");
      expect(result.success).toBe(false);
      expect(result.error).toBe("バケット名とファイルパスは必須です");
    });

    it("should successfully delete file", async () => {
      const { default: s3Client } = require("@/libs/s3");
      s3Client.send.mockResolvedValue({});

      const result = await deleteFileFromR2("song", "test.mp3");
      expect(result.success).toBe(true);
    });
  });
});
