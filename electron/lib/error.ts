/**
 * catchブロックのエラーから安全にメッセージを取得する
 * @param error - catchされたエラー
 * @param fallback - フォールバックメッセージ
 * @returns エラーメッセージ
 */
export function getErrorMessage(error: unknown, fallback = "Unknown error"): string {
  return error instanceof Error ? error.message : fallback;
}
