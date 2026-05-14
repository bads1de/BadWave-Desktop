/**
 * @jest-environment jsdom
 */
import { store } from "@/libs/electron/store";
import { isElectron } from "@/libs/electron/common";

jest.mock("@/libs/electron/common");

describe("electron/store", () => {
  const mockStoreGet = jest.fn();
  const mockStoreSet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (isElectron as jest.Mock).mockReturnValue(false);
    (window as any).electron = {
      store: {
        get: mockStoreGet,
        set: mockStoreSet,
      },
    };
    localStorage.clear();
  });

  describe("get", () => {
    it("should call electron store.get when in Electron", async () => {
      (isElectron as jest.Mock).mockReturnValue(true);
      mockStoreGet.mockResolvedValue("electron-value");

      const result = await store.get("test-key");
      expect(result).toBe("electron-value");
    });

    it("should return defaultValue when electron returns undefined", async () => {
      (isElectron as jest.Mock).mockReturnValue(true);
      mockStoreGet.mockResolvedValue(undefined);

      const result = await store.get("test-key", "default");
      expect(result).toBe("default");
    });

    it("should use localStorage when not in Electron", async () => {
      localStorage.setItem("test-key", JSON.stringify("local-value"));
      const result = await store.get("test-key");
      expect(result).toBe("local-value");
    });

    it("should return defaultValue when localStorage is empty", async () => {
      const result = await store.get("test-key", "default");
      expect(result).toBe("default");
    });
  });

  describe("set", () => {
    it("should call electron store.set when in Electron", async () => {
      (isElectron as jest.Mock).mockReturnValue(true);
      mockStoreSet.mockResolvedValue(true);

      const result = await store.set("test-key", "test-value");
      expect(result).toBe(true);
      expect(mockStoreSet).toHaveBeenCalledWith("test-key", "test-value");
    });

    it("should use localStorage when not in Electron", async () => {
      const result = await store.set("test-key", "local-value");
      expect(result).toBe(true);
      expect(localStorage.getItem("test-key")).toBe(JSON.stringify("local-value"));
    });
  });
});
