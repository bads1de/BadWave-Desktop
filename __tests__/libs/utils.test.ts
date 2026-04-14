/**
 * @jest-environment jsdom
 */
import { 
  cn, 
  getRandomColor, 
  splitTags, 
  sanitizeTitle, 
  generateRandomString, 
  formatTime, 
  downloadFile 
} from "@/libs/utils";

describe("libs/utils", () => {
  describe("cn", () => {
    it("should merge tailwind classes correctly", () => {
      expect(cn("px-2", "py-2")).toBe("px-2 py-2");
      expect(cn("px-2", { "py-2": true, "mb-4": false })).toBe("px-2 py-2");
    });
  });

  describe("getRandomColor", () => {
    it("should return a color from the predefined list", () => {
      const color = getRandomColor();
      const colors = [
        "#00ff87", "#60efff", "#0061ff", "#ff00a0", "#ff1700",
        "#fff700", "#a6ff00", "#00ffa3", "#00ffff", "#ff00ff"
      ];
      expect(colors).toContain(color);
    });
  });

  describe("splitTags", () => {
    it("should split tag string by comma and trim", () => {
      expect(splitTags("tag1, tag2 ,tag3")).toEqual(["tag1", "tag2", "tag3"]);
      expect(splitTags("")).toEqual([]);
      expect(splitTags(undefined)).toEqual([]);
    });
  });

  describe("sanitizeTitle", () => {
    it("should return same title if it contains only safe characters", () => {
      expect(sanitizeTitle("safe-title_123")).toBe("safe-title_123");
    });

    it("should return random string if title contains unsafe characters", () => {
      const result = sanitizeTitle("unsafe title!");
      expect(result).toHaveLength(10);
      expect(result).not.toBe("unsafe title!");
    });
  });

  describe("generateRandomString", () => {
    it("should generate a string of specified length", () => {
      expect(generateRandomString(5)).toHaveLength(5);
      expect(generateRandomString(20)).toHaveLength(20);
    });
  });

  describe("formatTime", () => {
    it("should format seconds into M:SS correctly", () => {
      expect(formatTime(0)).toBe("0:00");
      expect(formatTime(65)).toBe("1:05");
      expect(formatTime(600)).toBe("10:00");
    });
  });

  describe("downloadFile", () => {
    let mockFetch: jest.Mock;
    
    beforeEach(() => {
      mockFetch = jest.fn();
      global.fetch = mockFetch;
      
      // Mock window.URL
      global.URL.createObjectURL = jest.fn().mockReturnValue("blob:url");
      global.URL.revokeObjectURL = jest.fn();
    });

    it("should download file successfully", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(new Blob(["test"])),
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      
      await downloadFile("http://test.com", "test.txt");
      
      expect(mockFetch).toHaveBeenCalledWith("http://test.com", expect.any(Object));
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log error when network response is not ok", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      
      await downloadFile("http://test.com", "test.txt");
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log error when fetch fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network Error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      
      await downloadFile("http://test.com", "test.txt");
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
