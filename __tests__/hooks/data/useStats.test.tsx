/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import useStats from "@/hooks/data/useStats";
import { getListeningStats } from "@/actions/getStats";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// モック
jest.mock("@/actions/getStats", () => ({
  getListeningStats: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch stats with default period (week)", async () => {
    const mockStats = { play_count: 10, listening_time: 100 };
    (getListeningStats as jest.Mock).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.stats).toEqual(mockStats);
    expect(getListeningStats).toHaveBeenCalledWith("week");
  });

  it("should fetch stats with specified period", async () => {
    const mockStats = { play_count: 50 };
    (getListeningStats as jest.Mock).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useStats("month"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.stats).toEqual(mockStats);
    expect(getListeningStats).toHaveBeenCalledWith("month");
  });

  it("should handle error", async () => {
    (getListeningStats as jest.Mock).mockRejectedValue(new Error("Fetch failed"));

    const { result } = renderHook(() => useStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeTruthy();
  });
});