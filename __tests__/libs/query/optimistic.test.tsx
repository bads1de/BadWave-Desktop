import { QueryClient } from "@tanstack/react-query";
import {
  applyOptimisticUpdate,
  rollbackOptimisticUpdate,
} from "@/libs/query/optimistic";

describe("libs/query/optimistic", () => {
  const queryKey = ["test", "list"];
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("現在値を退避して楽観的に更新すること", async () => {
    queryClient.setQueryData(queryKey, [1, 2]);

    const context = await applyOptimisticUpdate<number[]>(
      queryClient,
      queryKey,
      (previous) => [...(previous ?? []), 3]
    );

    expect(queryClient.getQueryData(queryKey)).toEqual([1, 2, 3]);
    expect(context.previous).toEqual([1, 2]);
  });

  it("キャッシュ未取得の場合は空の値から更新すること", async () => {
    const context = await applyOptimisticUpdate<number[]>(
      queryClient,
      queryKey,
      (previous) => [...(previous ?? []), 1]
    );

    expect(queryClient.getQueryData(queryKey)).toEqual([1]);
    expect(context.previous).toBeUndefined();
  });

  it("退避した値にロールバックすること", async () => {
    queryClient.setQueryData(queryKey, [1, 2]);
    const context = await applyOptimisticUpdate<number[]>(
      queryClient,
      queryKey,
      () => []
    );

    expect(queryClient.getQueryData(queryKey)).toEqual([]);

    rollbackOptimisticUpdate(queryClient, queryKey, context);

    expect(queryClient.getQueryData(queryKey)).toEqual([1, 2]);
  });

  it("空配列に退避した値でもロールバックできること", async () => {
    queryClient.setQueryData(queryKey, []);
    const context = await applyOptimisticUpdate<number[]>(
      queryClient,
      queryKey,
      () => [1]
    );

    rollbackOptimisticUpdate(queryClient, queryKey, context);

    expect(queryClient.getQueryData(queryKey)).toEqual([]);
  });

  it("退避した値が無い場合は何もしないこと", async () => {
    const context = await applyOptimisticUpdate<number[]>(
      queryClient,
      queryKey,
      () => [1]
    );

    rollbackOptimisticUpdate(queryClient, queryKey, context);

    expect(queryClient.getQueryData(queryKey)).toEqual([1]);
  });
});
