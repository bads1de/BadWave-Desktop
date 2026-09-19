/**
 * ローカル曲ID (`local_` + base64url にエンコードしたファイルパス) の唯一のソース。
 *
 * electron/tsconfig.json の rootDir 制約で electron 側から `libs/` を参照できないため、
 * electron/constants.ts と同じ共有パターンを採る:
 *   - 正 (single source of truth): このファイル (electron 側)
 *   - レンダラー: `libs/songUtils.ts` が再エクスポートしたものを import する
 *
 * ワイヤフォーマットは変更しないこと (既存の保存済みID・テストとバイト単位で互換)。
 */

/** ローカル曲IDの接頭辞 */
export const LOCAL_SONG_ID_PREFIX = "local_";

/**
 * IDがローカル曲IDかどうかを判定する
 *
 * @param id - 判定対象 (string 以外は常に false)
 * @returns ローカル曲IDの場合 true
 */
export function isLocalSongId(id: unknown): boolean {
  return typeof id === "string" && id.startsWith(LOCAL_SONG_ID_PREFIX);
}

/**
 * ローカル曲用のIDを生成する
 *
 * パスを base64url にエンコードする。標準 base64 の `+` `/` `=` は
 * IPC バリデーションやファイル名に不向きなため URL-safe な文字のみ使う。
 *
 * @param filePath - 対象のファイルパス
 * @returns `local_` + base64url のID
 */
export function generateLocalSongId(filePath: string): string {
  const encoded = btoa(encodeURIComponent(filePath))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${LOCAL_SONG_ID_PREFIX}${encoded}`;
}

/**
 * ローカル曲のIDからファイルパスを復元する
 *
 * @param localId - ローカル曲のID
 * @returns ファイルパス (復元できない場合は null)
 */
export function extractFilePathFromLocalId(localId: string): string | null {
  if (!isLocalSongId(localId)) {
    return null;
  }

  try {
    let encoded = localId.substring(LOCAL_SONG_ID_PREFIX.length);
    // base64url → base64
    encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (encoded.length % 4 !== 0) {
      encoded += "=";
    }
    const decoded = atob(encoded);
    return decodeURIComponent(decoded);
  } catch (error) {
    console.error("Failed to decode local song ID:", error);
    return null;
  }
}
