/**
 * catchブロックのエラーから安全にメッセージを取得する
 *
 * レンダラー（ブラウザ/Next.js）側で使用する共通ユーティリティ。
 * 実装は electron/lib/error.ts を唯一のソースとし、ここでは再エクスポートのみ行う
 * (electron/constants.ts と同じ共有パターン。electron → libs の一方向依存)。
 *
 * @param error - catchされたエラー
 * @param fallback - フォールバックメッセージ
 * @returns エラーメッセージ
 */
export { getErrorMessage } from "../../electron/lib/error";
