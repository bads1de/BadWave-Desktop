/**
 * @jest-environment jsdom
 */
import {
  isElectron,
  getAppVersion,
  getPlatform,
  isNetworkError,
} from "@/libs/electron/common";

describe("electron/common", () => {
  beforeEach(() => {
    // Reset window.electron mock
    delete (window as any).electron;
  });

  describe("isElectron", () => {
    it("should return false when window.electron is undefined", () => {
      expect(isElectron()).toBe(false);
    });

    it("should return true when window.electron exists and isElectron is true", () => {
      (window as any).electron = {
        appInfo: { isElectron: true },
      };
      expect(isElectron()).toBe(true);
    });

    it("should return false when window.electron.isElectron is false", () => {
      (window as any).electron = {
        appInfo: { isElectron: false },
      };
      expect(isElectron()).toBe(false);
    });
  });

  describe("getAppVersion", () => {
    const originalEnv = process.env.NEXT_PUBLIC_APP_VERSION;

    afterEach(() => {
      process.env.NEXT_PUBLIC_APP_VERSION = originalEnv;
    });

    it("should return version from env when not in Electron", () => {
      process.env.NEXT_PUBLIC_APP_VERSION = "1.2.3";
      expect(getAppVersion()).toBe("1.2.3");
    });

    it("should return version from Electron when available", () => {
      (window as any).electron = {
        appInfo: { getVersion: jest.fn().mockReturnValue("2.0.0") },
      };
      expect(getAppVersion()).toBe("2.0.0");
    });

    it("should return fallback version when nothing is available", () => {
      delete process.env.NEXT_PUBLIC_APP_VERSION;
      expect(getAppVersion()).toBe("0.0.0");
    });
  });

  describe("getPlatform", () => {
    it("should return 'web' when not in Electron", () => {
      expect(getPlatform()).toBe("web");
    });

    it("should return platform from Electron when available", () => {
      (window as any).electron = {
        appInfo: { platform: "win32" },
      };
      expect(getPlatform()).toBe("win32");
    });
  });

  describe("isNetworkError", () => {
    it("should return true for Failed to fetch error", () => {
      expect(isNetworkError(new Error("Failed to fetch"))).toBe(true);
    });

    it("should return true for NetworkError", () => {
      expect(isNetworkError(new Error("NetworkError"))).toBe(true);
    });

    it("should return true for ENOTFOUND error", () => {
      expect(isNetworkError(new Error("ENOTFOUND"))).toBe(true);
    });

    it("should return true for ECONNREFUSED error", () => {
      expect(isNetworkError(new Error("ECONNREFUSED"))).toBe(true);
    });

    it("should return true for net::ERR_ error", () => {
      expect(isNetworkError(new Error("net::ERR_CONNECTION_REFUSED"))).toBe(true);
    });

    it("should return false for unrelated errors", () => {
      expect(isNetworkError(new Error("Some other error"))).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
    });

    it("should handle string error messages", () => {
      expect(isNetworkError({ message: "Failed to fetch" })).toBe(true);
    });
  });
});
