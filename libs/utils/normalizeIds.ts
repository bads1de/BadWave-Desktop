/**
 * Supabase から取得したデータの数値IDを文字列に揃える
 *
 * songs / playlists / spotlights などの id は数値カラムのため JSON では number で返るが、
 * アプリ内部（IPC バリデーション・再生キュー・SQLite キャッシュ・型定義）は
 * 文字列IDを前提とする。直接取得・JOIN 経由・RPC のどれでも起きるため取り込み口で揃える。
 *
 * @param rows - Supabase のレスポンス（null/undefined 可）
 * @returns IDを文字列にした同じ形の配列
 */
export function normalizeIds<T extends { id: unknown }>(
  rows: T[] | null | undefined,
): T[] {
  return (rows ?? []).map((row) => ({ ...row, id: String(row.id) }) as T);
}
