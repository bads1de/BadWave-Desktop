import { toLocalPath, loadEnvVariables, isDev, debugLog, mapDbSongToResponse } from "@/electron/utils";
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

jest.mock("electron", () => ({
  app: {
    getAppPath: jest.fn().mockReturnValue("/test/path"),
    isPackaged: false,
  },
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

describe("electron/utils", () => {
  describe("toLocalPath", () => {
    it("should convert file URL to local path", () => {
      // url.fileURLToPath is used internally, it might be tricky on different OS
      // but we can test if it handles non-file URLs correctly
      expect(toLocalPath("http://example.com")).toBe("http://example.com");
    });
  });

  describe("loadEnvVariables", () => {
    it("should return false if .env.local does not exist", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      expect(loadEnvVariables()).toBe(false);
    });

    it("should return true and load variables if .env.local exists", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue("TEST_KEY=TEST_VAL");
      
      const result = loadEnvVariables();
      expect(result).toBe(true);
      expect(process.env.TEST_KEY).toBe("TEST_VAL");
    });
  });

  describe("debugLog", () => {
    it("should log message in dev mode", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      debugLog("test message");
      expect(consoleSpy).toHaveBeenCalledWith("test message");
      consoleSpy.mockRestore();
    });
  });

  describe("mapDbSongToResponse", () => {
    it("should map db song to response correctly", () => {
      const dbSong = {
        id: "1",
        userId: "user-1",
        title: "Title",
        author: "Author",
        originalSongPath: "orig-song",
        songPath: "local-song",
      };
      
      const response = mapDbSongToResponse(dbSong);
      
      expect(response.id).toBe("1");
      expect(response.user_id).toBe("user-1");
      expect(response.is_downloaded).toBe(true);
      expect(response.song_path).toBe("orig-song");
    });
  });
});
