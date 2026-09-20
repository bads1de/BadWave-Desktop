/**
 * catchブロックのエラーから安全にメッセージを取得する
 *
 * web / desktop / mobile で同一の契約:
 * - `message` が文字列または数値で、空白以外の文字を含む場合はそれをそのまま返す
 * - それ以外（欠落・null / undefined・空文字・真偽値・オブジェクトなど）は fallback を返す
 *
 * 「message が空だから空文字を返す」とエラーが UI やログに何も残らないため、
 * 必ず空でない文字列を返す。
 *
 * @param error - catchされたエラー
 * @param fallback - フォールバックメッセージ
 * @returns 空でないエラーメッセージ
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Unknown error",
): string {
  const message = extractMessage(error);
  return message !== null && message.trim().length > 0 ? message : fallback;
}

/**
 * エラーからメッセージ文字列を取り出す（取り出せない場合は null）
 * @param error - catchされたエラー
 * @returns メッセージ文字列、または null
 */
function extractMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  // Supabase 等のエラーは { message: string } 形式のオブジェクトであることが多い
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    // 数値で返ることもあるため string / number のみ受け付ける。
    // それ以外（null / undefined / boolean / オブジェクト）は文字列化しない
    if (typeof message === "string" || typeof message === "number") {
      return String(message);
    }
  }

  return null;
}
