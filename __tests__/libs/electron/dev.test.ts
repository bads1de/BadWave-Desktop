/**
 * @jest-environment jsdom
 */
import { dev } from "@/libs/electron/dev";
import { isElectron } from "@/libs/electron/common";

jest.mock("@/libs/electron/common");

describe("electron/dev", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isElectron as jest.Mock).mockReturnValue(false);
  });

  describe("toggleOfflineSimulation", () => {
    it("should call electron dev toggle when in Electron", async () => {
      (isElectron as jest.Mock).mockReturnValue(true);
      (window as any).electron = {
        dev: {
          toggleOfflineSimulation: jest.fn().mockResolvedValue({ isOffline: true }),
        },
      };

      const result = await dev.toggleOfflineSimulation();
      expect(result).toEqual({ isOffline: true });
      expect((window as any).electron.dev.toggleOfflineSimulation).toHaveBeenCalled();
    });

    it("should return isOffline: false when not in Electron", async () => {
      const result = await dev.toggleOfflineSimulation();
      expect(result).toEqual({ isOffline: false });
    });
  });

  describe("getOfflineSimulationStatus", () => {
    it("should call electron dev status when in Electron", async () => {
      (isElectron as jest.Mock).mockReturnValue(true);
      (window as any).electron = {
        dev: {
          getOfflineSimulationStatus: jest.fn().mockResolvedValue({ isOffline: false }),
        },
      };

      const result = await dev.getOfflineSimulationStatus();
      expect(result).toEqual({ isOffline: false });
    });

    it("should return isOffline: false when not in Electron", async () => {
      const result = await dev.getOfflineSimulationStatus();
      expect(result).toEqual({ isOffline: false });
    });
  });

  describe("setOfflineSimulation", () => {
    it("should call electron dev set when in Electron", async () => {
      (isElectron as jest.Mock).mockReturnValue(true);
      (window as any).electron = {
        dev: {
          setOfflineSimulation: jest.fn().mockResolvedValue({ isOffline: true }),
        },
      };

      const result = await dev.setOfflineSimulation(true);
      expect(result).toEqual({ isOffline: true });
      expect((window as any).electron.dev.setOfflineSimulation).toHaveBeenCalledWith(true);
    });

    it("should return isOffline: false when not in Electron", async () => {
      const result = await dev.setOfflineSimulation(true);
      expect(result).toEqual({ isOffline: false });
    });
  });
});
