/**
 * @jest-environment jsdom
 */
import { windowControls } from "@/libs/electron/window";
import { isElectron } from "@/libs/electron/common";

jest.mock("@/libs/electron/common");

describe("electron/window", () => {
  const mockMinimize = jest.fn().mockResolvedValue(undefined);
  const mockMaximize = jest.fn().mockResolvedValue(undefined);
  const mockClose = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (isElectron as jest.Mock).mockReturnValue(false);
    (window as any).electron = {
      window: {
        minimize: mockMinimize,
        maximize: mockMaximize,
        close: mockClose,
      },
    };
  });

  describe("minimize", () => {
    it("should call electron window.minimize when in Electron", async () => {
      (isElectron as jest.Mock).mockReturnValue(true);

      await windowControls.minimize();
      expect(mockMinimize).toHaveBeenCalled();
    });

    it("should resolve silently when not in Electron", async () => {
      await expect(windowControls.minimize()).resolves.toBeUndefined();
    });
  });

  describe("maximize", () => {
    it("should call electron window.maximize when in Electron", async () => {
      (isElectron as jest.Mock).mockReturnValue(true);

      await windowControls.maximize();
      expect(mockMaximize).toHaveBeenCalled();
    });

    it("should resolve silently when not in Electron", async () => {
      await expect(windowControls.maximize()).resolves.toBeUndefined();
    });
  });

  describe("close", () => {
    it("should call electron window.close when in Electron", async () => {
      (isElectron as jest.Mock).mockReturnValue(true);

      await windowControls.close();
      expect(mockClose).toHaveBeenCalled();
    });

    it("should resolve silently when not in Electron", async () => {
      await expect(windowControls.close()).resolves.toBeUndefined();
    });
  });
});
