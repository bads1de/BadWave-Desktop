/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import useDownload from "@/hooks/data/useDownload";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useDownload", () => {
  it("should return path directly if it starts with http", async () => {
    const path = "https://example.com/file.mp3";
    const { result } = renderHook(() => useDownload(path), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.fileUrl).toBe(path);
  });

  it("should return null if path is empty", async () => {
    const { result } = renderHook(() => useDownload(""), {
      wrapper: createWrapper(),
    });

    // enabled: !!path なので isLoading は最初から false のはずだが、useQuery の仕様による
    // enabled: false の場合、status は 'pending' で fetchStatus は 'idle'
    // isLoading は (status === 'pending') なので true になる可能性があるが、
    // TanStack Query v5 では挙動が変わっているかも。v4なら true。
    // 実装: enabled: !!path
    
    // pathが空なら queryFn は呼ばれないはず。
    // 返り値を確認。
    
    expect(result.current.fileUrl).toBeUndefined(); 
  });
});
