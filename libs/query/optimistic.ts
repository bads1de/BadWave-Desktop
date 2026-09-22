import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * 楽観更新でロールバック用に退避した値
 */
export interface OptimisticContext<T> {
  previous: T | undefined;
}

/**
 * 楽観更新の定型処理をまとめて実行する
 *
 * 「cancelQueries → 現在値の退避 → 楽観的な更新」を1度に呼び出し、
 * ロールバック用のコンテキストを返す。onMutate から返すことで、
 * onError で rollbackOptimisticUpdate に渡せる。
 *
 * @example
 * onMutate: ({ id }) =>
 *   applyOptimisticUpdate<Playlist[]>(queryClient, key, (old) =>
 *     (old ?? []).filter((p) => p.id !== id)
 *   ),
 */
export const applyOptimisticUpdate = async <T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  update: (previous: T | undefined) => T
): Promise<OptimisticContext<T>> => {
  await queryClient.cancelQueries({ queryKey });

  const previous = queryClient.getQueryData<T>(queryKey);
  queryClient.setQueryData<T>(queryKey, (old) => update(old));

  return { previous };
};

/**
 * applyOptimisticUpdate で退避した値にキャッシュを戻す
 *
 * 退避した値が無い（キャッシュ未取得だった）場合は何もしない。
 */
export const rollbackOptimisticUpdate = <T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  context: OptimisticContext<T> | undefined
): void => {
  if (context?.previous !== undefined) {
    queryClient.setQueryData(queryKey, context.previous);
  }
};
