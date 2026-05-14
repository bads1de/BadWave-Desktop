/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSyncBase } from "@/hooks/sync/useSyncBase";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { electronAPI } from "@/libs/electron/index";

jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("@/libs/electron/index");

describe("useSyncBase", () => {
  const mockSyncFn = jest.fn().mockResolvedValue({ success: true, count: 5 });

  beforeEach(() => {
    jest.clearAllMocks();
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    (electronAPI.isElectron as jest.Mock).mockReturnValue(true);
  });

  it("should return sync function and isSyncing state", () => {
    const { result } = renderHook(() => useSyncBase(mockSyncFn, { autoSync: false }));
    expect(result.current.sync).toBeDefined();
    expect(result.current.isSyncing).toBe(false);
  });

  it("should call syncFn when sync() is called", async () => {
    const { result } = renderHook(() => useSyncBase(mockSyncFn, { autoSync: false }));

    let res: any;
    await act(async () => {
      res = await result.current.sync();
    });

    expect(mockSyncFn).toHaveBeenCalledTimes(1);
    expect(res.success).toBe(true);
    expect(res.count).toBe(5);
  });

  it("should return failure when offline", async () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });

    const { result } = renderHook(() => useSyncBase(mockSyncFn, { autoSync: false }));

    let res: any;
    await act(async () => {
      res = await result.current.sync();
    });

    expect(mockSyncFn).not.toHaveBeenCalled();
    expect(res.success).toBe(false);
    expect(res.reason).toBe("conditions_not_met");
  });

  it("should return failure when not in Electron", async () => {
    (electronAPI.isElectron as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useSyncBase(mockSyncFn, { autoSync: false }));

    let res: any;
    await act(async () => {
      res = await result.current.sync();
    });

    expect(mockSyncFn).not.toHaveBeenCalled();
    expect(res.success).toBe(false);
  });

  it("should return failure when canSync returns false", async () => {
    const { result } = renderHook(() =>
      useSyncBase(mockSyncFn, { autoSync: false, canSync: () => false })
    );

    let res: any;
    await act(async () => {
      res = await result.current.sync();
    });

    expect(mockSyncFn).not.toHaveBeenCalled();
    expect(res.success).toBe(false);
    expect(res.reason).toBe("conditions_not_met");
  });

  it("should prevent concurrent syncs", async () => {
    const slowSyncFn = jest.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    const { result } = renderHook(() => useSyncBase(slowSyncFn, { autoSync: false }));

    let res1: any, res2: any;
    await act(async () => {
      const p1 = result.current.sync();
      const p2 = result.current.sync();
      res1 = await p1;
      res2 = await p2;
    });

    expect(slowSyncFn).toHaveBeenCalledTimes(1);
    expect(res2.success).toBe(false);
    expect(res2.reason).toBe("already_syncing");
  });

  it("should set isSyncing while syncing", async () => {
    const { result } = renderHook(() => useSyncBase(mockSyncFn, { autoSync: false }));

    // Start sync but don't await it yet
    let syncPromise: Promise<any>;
    act(() => {
      syncPromise = result.current.sync();
    });

    // After calling sync, isSyncing should be true
    expect(result.current.isSyncing).toBe(true);

    // Wait for sync to complete
    await act(async () => {
      await syncPromise!;
    });

    expect(result.current.isSyncing).toBe(false);
  });

  it("should handle sync function errors", async () => {
    const errorSyncFn = jest.fn().mockRejectedValue(new Error("Sync failed"));

    const { result } = renderHook(() => useSyncBase(errorSyncFn, { autoSync: false }));

    let res: any;
    await act(async () => {
      res = await result.current.sync();
    });

    expect(res.success).toBe(false);
    expect(res.reason).toBe("error");
    expect(res.error).toBeDefined();
  });

  it("should auto sync when online on mount (autoSync = true)", async () => {
    renderHook(() => useSyncBase(mockSyncFn, { autoSync: true }));

    await waitFor(() => {
      expect(mockSyncFn).toHaveBeenCalled();
    });
  });

  it("should not auto sync when autoSync = false", () => {
    renderHook(() => useSyncBase(mockSyncFn, { autoSync: false }));

    expect(mockSyncFn).not.toHaveBeenCalled();
  });
});
