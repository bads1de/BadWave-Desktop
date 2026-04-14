/**
 * @jest-environment jsdom
 */
import { auth } from "@/libs/electron/auth";

describe("libs/electron/auth", () => {
  const mockElectron = (window as any).electron;

  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでElectron環境として設定
    Object.defineProperty(window, "electron", {
      value: mockElectron,
      writable: true,
      configurable: true,
    });
  });

  describe("saveCachedUser", () => {
    it("should call electron.auth.saveCachedUser when in electron", async () => {
      const user = { id: "123", email: "test@example.com" };
      await auth.saveCachedUser(user);
      expect(mockElectron.auth.saveCachedUser).toHaveBeenCalledWith(user);
    });

    it("should return success: false when not in electron", async () => {
      // Electron環境ではない状態を作る
      const originalElectron = (window as any).electron;
      delete (window as any).electron;

      const user = { id: "123", email: "test@example.com" };
      const result = await auth.saveCachedUser(user);
      expect(result).toEqual({ success: false });

      // 復元
      (window as any).electron = originalElectron;
    });
  });

  describe("getCachedUser", () => {
    it("should call electron.auth.getCachedUser when in electron", async () => {
      await auth.getCachedUser();
      expect(mockElectron.auth.getCachedUser).toHaveBeenCalled();
    });

    it("should return null when not in electron", async () => {
      const originalElectron = (window as any).electron;
      delete (window as any).electron;

      const result = await auth.getCachedUser();
      expect(result).toBeNull();

      (window as any).electron = originalElectron;
    });
  });

  describe("clearCachedUser", () => {
    it("should call electron.auth.clearCachedUser when in electron", async () => {
      await auth.clearCachedUser();
      expect(mockElectron.auth.clearCachedUser).toHaveBeenCalled();
    });

    it("should return success: false when not in electron", async () => {
      const originalElectron = (window as any).electron;
      delete (window as any).electron;

      const result = await auth.clearCachedUser();
      expect(result).toEqual({ success: false });

      (window as any).electron = originalElectron;
    });
  });
});
