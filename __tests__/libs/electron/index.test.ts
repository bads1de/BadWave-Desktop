/**
 * @jest-environment jsdom
 */
import { electronAPI, isElectron, getAppVersion, getPlatform, isNetworkError } from "@/libs/electron/index";

describe("electron/index", () => {
  it("should export electronAPI with all sub-modules", () => {
    expect(electronAPI.isElectron).toBeDefined();
    expect(electronAPI.getAppVersion).toBeDefined();
    expect(electronAPI.getPlatform).toBeDefined();
    expect(electronAPI.windowControls).toBeDefined();
    expect(electronAPI.store).toBeDefined();
    expect(electronAPI.mediaControls).toBeDefined();
    expect(electronAPI.ipc).toBeDefined();
    expect(electronAPI.offline).toBeDefined();
    expect(electronAPI.dev).toBeDefined();
    expect(electronAPI.cache).toBeDefined();
    expect(electronAPI.auth).toBeDefined();
    expect(electronAPI.miniPlayer).toBeDefined();
  });

  it("should re-export individual functions", () => {
    expect(isElectron).toBeDefined();
    expect(getAppVersion).toBeDefined();
    expect(getPlatform).toBeDefined();
    expect(isNetworkError).toBeDefined();
  });
});
