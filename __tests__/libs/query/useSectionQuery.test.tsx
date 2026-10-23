/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from "@tanstack/react-query";
import { useSectionQuery } from "@/libs/query/useSectionQuery";

jest.mock("@/libs/electron", () => ({
  electronAPI: {
    isElectron: jest.fn(),
    cache: {
      getSectionData: jest.fn(),
    },
  },
  isNetworkError: (error: unknown) =>
    error instanceof Error && error.message.includes("Network"),
}));

import { electronAPI } from "@/libs/electron";

const isElectron = electronAPI.isElectron as jest.Mock;
const getSectionData = electronAPI.cache.getSectionData as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("useSectionQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    act(() => {
      onlineManager.setOnline(true);
    });
  });

  it("Electron: 非空のセクションキャッシュを返し、Web は呼ばない", async () => {
    isElectron.mockReturnValue(true);
    getSectionData.mockResolvedValue([{ id: "cache-1" }]);
    const webFn = jest.fn();

    const { result } = renderHook(
      () =>
        useSectionQuery({
          queryKey: ["section-hit"],
          webFn,
          electron: { sectionKey: "home_spotlight", sectionType: "spotlights" },
          emptySectionFallback: [],
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([{ id: "cache-1" }]);
    expect(getSectionData).toHaveBeenCalledWith(
      "home_spotlight",
      "spotlights",
    );
    expect(webFn).not.toHaveBeenCalled();
  });

  it("Electron: 空のセクションキャッシュはオンライン時に Web へフォールバックする", async () => {
    isElectron.mockReturnValue(true);
    getSectionData.mockResolvedValue([]);
    const webFn = jest.fn().mockResolvedValue([{ id: "web-1" }]);

    const { result } = renderHook(
      () =>
        useSectionQuery({
          queryKey: ["section-empty"],
          webFn,
          electron: { sectionKey: "home_latest_songs", sectionType: "songs" },
          emptySectionFallback: [],
          networkMode: "always",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(webFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([{ id: "web-1" }]);
  });

  it("Electron: キャッシュ読み取り失敗はオンライン時に Web へフォールバックする", async () => {
    isElectron.mockReturnValue(true);
    getSectionData.mockRejectedValue(new Error("DB is locked"));
    const webFn = jest.fn().mockResolvedValue([{ id: "web-2" }]);

    const { result } = renderHook(
      () =>
        useSectionQuery({
          queryKey: ["section-error-online"],
          webFn,
          electron: { sectionKey: "trend_all", sectionType: "songs" },
          emptySectionFallback: [],
          networkMode: "always",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(webFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([{ id: "web-2" }]);
  });

  it("Electron: 空のセクションキャッシュはオフライン時に emptySectionFallback を返す", async () => {
    isElectron.mockReturnValue(true);
    getSectionData.mockResolvedValue([]);
    const webFn = jest.fn();

    act(() => {
      onlineManager.setOnline(false);
    });

    const { result } = renderHook(
      () =>
        useSectionQuery({
          queryKey: ["section-empty-offline"],
          webFn,
          electron: { sectionKey: "home_public_playlists", sectionType: "playlists" },
          emptySectionFallback: [],
          networkMode: "always",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(webFn).not.toHaveBeenCalled();
  });

  it("Electron: キャッシュ読み取り失敗はオフライン時に offlineFallback を返す", async () => {
    isElectron.mockReturnValue(true);
    getSectionData.mockRejectedValue(new Error("DB is locked"));
    const webFn = jest.fn();
    const offlineFallback = [{ id: "persisted" }];

    act(() => {
      onlineManager.setOnline(false);
    });

    const { result } = renderHook(
      () =>
        useSectionQuery({
          queryKey: ["section-error-offline"],
          webFn,
          electron: { sectionKey: "home_spotlight", sectionType: "spotlights" },
          emptySectionFallback: [],
          offlineFallback,
          networkMode: "always",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(offlineFallback);
    expect(webFn).not.toHaveBeenCalled();
  });

  it("Electron: getLocal が null を返した場合のみ Web へフォールバックする", async () => {
    isElectron.mockReturnValue(true);
    const getLocal = jest.fn().mockResolvedValue(null);
    const webFn = jest.fn().mockResolvedValue([{ id: "web-3" }]);

    const { result } = renderHook(
      () =>
        useSectionQuery({
          queryKey: ["local-null"],
          webFn,
          electron: { getLocal },
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(webFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([{ id: "web-3" }]);
  });

  it("Electron: getLocal の空配列はローカルの確定結果として扱う", async () => {
    isElectron.mockReturnValue(true);
    const getLocal = jest.fn().mockResolvedValue([]);
    const webFn = jest.fn();

    const { result } = renderHook(
      () =>
        useSectionQuery({
          queryKey: ["local-empty"],
          webFn,
          electron: { getLocal },
          networkMode: "always",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(webFn).not.toHaveBeenCalled();
  });

  it("Electron: getLocal の失敗はオンライン時に Web へフォールバックする", async () => {
    isElectron.mockReturnValue(true);
    const getLocal = jest.fn().mockRejectedValue(new Error("SQLite error"));
    const webFn = jest.fn().mockResolvedValue([{ id: "web-4" }]);

    const { result } = renderHook(
      () =>
        useSectionQuery({
          queryKey: ["local-error"],
          webFn,
          electron: { getLocal },
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(webFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([{ id: "web-4" }]);
  });
});
