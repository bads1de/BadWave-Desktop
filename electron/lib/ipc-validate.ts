import * as path from "path";
import { z } from "zod";

/**
 * 共通ZodスキーマとIPC入力検証ヘルパー
 *
 * 使い方:
 *   const validated = validateInput(mySchema, data, "channel-name");
 *   // 検証失敗時はエラーをthrow、ハンドラが適切にcatch
 */

const MAX_ID_LENGTH = 64;
const MAX_FILENAME_LENGTH = 255;
const MAX_URL_LENGTH = 2048;
const MAX_LYRICS_LENGTH = 50000;
const MAX_STORE_KEY_LENGTH = 64;

/**
 * 汎用IDスキーマ (UUIDや数値IDを想定)
 */
export const idSchema = z
  .string()
  .min(1, "ID cannot be empty")
  .max(MAX_ID_LENGTH, `ID must be ${MAX_ID_LENGTH} chars or less`)
  .regex(/^[A-Za-z0-9_\-:.]+$/, "ID contains invalid characters");

/**
 * ファイル名スキーマ: パストラバーサル防止
 * - パスの区切り文字 (`/`, `\`) 禁止
 * - `..` 禁止
 * - 制御文字禁止
 * - 255文字以内
 */
export const filenameSchema = z
  .string()
  .min(1, "Filename cannot be empty")
  .max(MAX_FILENAME_LENGTH, `Filename must be ${MAX_FILENAME_LENGTH} chars or less`)
  .regex(/^[^/\\:*?"<>|\x00-\x1f]+$/, "Filename contains invalid characters")
  .refine((s) => s !== "." && s !== "..", "Path traversal is not allowed");

/**
 * ファイルパススキーマ: 絶対パスのみ許可 (POSIX/Windows両対応)
 * - POSIX: `/foo/bar`
 * - Windows: `C:\foo\bar` or `C:/foo/bar`
 * - UNC: `\\server\share` or `//server/share`
 * ※呼び出し側で `path.resolve` + `path.normalize` による最終チェック推奨
 */
export const filePathSchema = z
  .string()
  .min(1, "Path cannot be empty")
  .max(4096, "Path too long")
  .refine(
    (s) =>
      s.startsWith("/") ||
      /^[a-zA-Z]:[\\/]/.test(s) ||
      s.startsWith("\\\\") ||
      s.startsWith("//"),
    "Must be an absolute path",
  );

/**
 * 外部URLスキーマ: HTTP/HTTPSのみ、`javascript:` 等の危険なスキームを排除
 */
export const externalUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .max(MAX_URL_LENGTH, `URL must be ${MAX_URL_LENGTH} chars or less`)
  .refine(
    (s) => {
      try {
        const u = new URL(s);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "Only http/https URLs are allowed" },
  );

/**
 * 認証用URLスキーマ: SupabaseのコールバックURLのみ許可
 * ※ `auth/callback` を含む、またはSupabaseのドメイン
 */
export const authUrlSchema = externalUrlSchema.refine(
  (s) => {
    try {
      const u = new URL(s);
      return (
        u.hostname.endsWith(".supabase.co") ||
        u.hostname.endsWith(".supabase.in") ||
        u.hostname === "accounts.google.com" ||
        u.pathname.includes("/auth/callback")
      );
    } catch {
      return false;
    }
  },
  { message: "Auth URL must point to a trusted provider" },
);

/**
 * 設定ストアキー: 英数字とドット/アンダースコアのみ
 */
export const storeKeySchema = z
  .string()
  .min(1, "Store key cannot be empty")
  .max(MAX_STORE_KEY_LENGTH, `Store key must be ${MAX_STORE_KEY_LENGTH} chars or less`)
  .regex(/^[A-Za-z0-9._-]+$/, "Store key contains invalid characters");

/**
 * 設定ストア値: JSONシリアライズ可能な型に限定
 */
export const storeValueSchema: z.ZodType<unknown> = z.union([
  z.string().max(10000),
  z.number().finite(),
  z.boolean(),
  z.null(),
  z.array(z.unknown()).max(1000),
  z.record(z.string(), z.unknown()),
]);

/**
 * 楽曲ダウンロードペイロード
 */
export const songDownloadPayloadSchema = z.object({
  id: idSchema,
  userId: idSchema,
  title: z.string().min(1).max(500),
  author: z.string().min(1).max(500),
  song_path: z.string().url().max(MAX_URL_LENGTH),
  image_path: z
    .string()
    .url()
    .max(MAX_URL_LENGTH)
    .optional()
    .or(z.literal("")),
  duration: z.number().int().nonnegative().optional(),
  genre: z.string().max(100).optional(),
  lyrics: z.string().max(MAX_LYRICS_LENGTH).optional(),
  video_path: z.string().url().max(MAX_URL_LENGTH).optional(),
  created_at: z.string().min(1).max(100),
});

/**
 * キャッシュユーザー情報
 */
export const cachedUserSchema = z.object({
  id: idSchema,
  email: z.string().email().max(320).optional(),
  avatarUrl: z.string().url().max(MAX_URL_LENGTH).optional(),
});

/**
 * いいね曲の入力
 */
export const likedSongInputSchema = z.object({
  userId: idSchema,
  songId: idSchema,
});

/**
 * プレイリスト曲の入力
 */
export const playlistSongInputSchema = z.object({
  playlistId: idSchema,
  songId: idSchema,
});

/**
 * トランスクライブ入力: コマンドインジェクション防止のためlyricsTextの特殊文字を検証
 */
export const transcribeInputSchema = z
  .tuple([
    z.string().min(1).max(MAX_URL_LENGTH), // audioPath
    z.string().max(MAX_LYRICS_LENGTH), // lyricsText
  ])
  .or(
    z.object({
      audioPath: z.string().min(1).max(MAX_URL_LENGTH),
      lyricsText: z.string().max(MAX_LYRICS_LENGTH),
    }),
  );

/**
 * 入力検証ヘルパー
 *
 * @param schema Zodスキーマ
 * @param data 検証対象の不明データ
 * @param channel エラー報告用のチャンネル名
 * @returns 検証済みデータ
 * @throws Error 検証失敗時
 */
export function validateInput<T>(
  schema: z.ZodType<T>,
  data: unknown,
  channel: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`[IPC:${channel}] Invalid input - ${issues}`);
  }
  return result.data;
}
