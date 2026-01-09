/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useSyncHomeAll } from "@/hooks/sync/useSyncHomeAll";

// 各シンクフックのモック
const mockSync = jest.fn().mockResolvedValue({ success: true });

jest.mock("@/hooks/sync/useSyncTrends", () => ({
  useSyncTrends: () => ({ sync: mockSync }),
}));
jest.mock("@/hooks/sync/useSyncSpotlight", () => ({
  useSyncSpotlight: () => ({ sync: mockSync }),
}));
jest.mock("@/hooks/sync/useSyncLatestSongs", () => ({
  useSyncLatestSongs: () => ({ sync: mockSync }),
}));
jest.mock("@/hooks/sync/useSyncRecommendations", () => ({
  useSyncRecommendations: () => ({ sync: mockSync }),
}));
jest.mock("@/hooks/sync/useSyncPublicPlaylists", () => ({
  useSyncPublicPlaylists: () => ({ sync: mockSync }),
}));

describe("useSyncHomeAll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("すべてのホームセクションの同期を呼び出す", async () => {
    const { result } = renderHook(() => useSyncHomeAll());

    let syncResult;
    await act(async () => {
      syncResult = await result.current.sync();
    });

    expect(syncResult?.success).toBe(true);
    expect(mockSync).toHaveBeenCalledTimes(5);
  });

  it("いずれかの同期が失敗した場合は全体として失敗を返す", async () => {
    mockSync
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, reason: "error" })
      .mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSyncHomeAll());

    let syncResult;
    await act(async () => {
      syncResult = await result.current.sync();
    });

    expect(syncResult?.success).toBe(false);
    expect(mockSync).toHaveBeenCalledTimes(5);
  });
});