/**
 * catchブロックのエラーから安全にメッセージを取得する
 * レンダラー（ブラウザ/Next.js）側で使用する共通ユーティリティ。
 * Electron main 側は electron/lib/error.ts（rootDir 制約のため）
 * @param error - catchされたエラー
 * @param fallback - フォールバックメッセージ
 * @returns エラーメッセージ
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Unknown error"
): string {
  if (error instanceof Error) return error.message;
  // Supabase 等のエラーは { message: string } 形式のオブジェクトであることが多い
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return fallback;
}