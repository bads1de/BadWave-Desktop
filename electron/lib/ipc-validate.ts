import { z } from "zod";
import { LOCAL_SONG_ID_PREFIX } from "./song-id";

/**
 * 共通ZodスキーマとIPC入力検証ヘルパー
 *
 * 使い方:
 *   const validated = validateInput(mySchema, data, "channel-name");
 *   // 検証失敗時はエラーをthrow、ハンドラが適切にcatch
 */

const MAX_ID_LENGTH = 64;
const MAX_LOCAL_ID_LENGTH = 512;
const MAX_FILENAME_LENGTH = 255;
const MAX_URL_LENGTH = 2048;
const MAX_AUDIO_PATH_LENGTH = 2048;
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
 * ローカル曲IDスキーマ (`local_` + base64url でパスを埋め込む形式)
 * ファイルパスが長いため通常の idSchema より緩い
 */
export const localIdSchema = z
  .string()
  .min(1, "ID cannot be empty")
  .max(MAX_LOCAL_ID_LENGTH, `Local ID must be ${MAX_LOCAL_ID_LENGTH} chars or less`)
  .regex(
    new RegExp(`^${LOCAL_SONG_ID_PREFIX}[A-Za-z0-9_\\-]+$`),
    "Local ID contains invalid characters",
  );

/**
 * 楽曲ID: リモートUUID / ローカル埋め込みID の両方を受け付ける
 */
export const songIdSchema = z.union([idSchema, localIdSchema]);

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
  // React Query キャッシュ等が巨大な値で永続化されるため長さ制限なし
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
  z.array(z.unknown()),
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

/** トランスクライブ対象の音声パス (ローカルパスまたはURL) */
export const audioPathSchema = z.string().min(1).max(MAX_AUDIO_PATH_LENGTH);

/** トランスクライブに渡す歌詞テキスト */
export const lyricsTextSchema = z.string().max(MAX_LYRICS_LENGTH);

/**
 * トランスクライブ入力 (タプル形式 / オブジェクト形式の両方を受け付ける)
 */
export const transcribeInputSchema = z
  .tuple([audioPathSchema, lyricsTextSchema])
  .or(
    z.object({
      audioPath: audioPathSchema,
      lyricsText: lyricsTextSchema,
    }),
  );

/**
 * 同期系ID: Supabase は数値IDを返すことがあるため string / number 両方を受け付ける
 */
const syncIdSchema = z.union([z.string().min(1).max(128), z.number()]);

/** null 許容の任意文字列 */
const nullableString = (max: number) =>
  z.string().max(max).nullable().optional();

/**
 * 曲の同期ペイロード (SongForSync)
 * mapper が参照しない追加フィールドはそのまま通す (passthrough)
 */
export const songForSyncSchema = z
  .object({
    id: syncIdSchema,
    user_id: z.union([z.string().max(128), z.number()]).nullable().optional(),
    title: z.string().max(1000).nullable().optional(),
    author: z.string().max(1000).nullable().optional(),
    song_path: nullableString(MAX_URL_LENGTH),
    image_path: nullableString(MAX_URL_LENGTH),
    video_path: nullableString(MAX_URL_LENGTH),
    genre: nullableString(200),
    count: z.union([z.string(), z.number()]).nullable().optional(),
    like_count: z.union([z.string(), z.number()]).nullable().optional(),
    created_at: z.string().max(200).nullable().optional(),
    duration: z.union([z.number(), z.string()]).nullable().optional(),
    lyrics: z.string().max(MAX_LYRICS_LENGTH).nullable().optional(),
    is_downloaded: z.boolean().optional(),
    local_song_path: nullableString(4096),
    local_image_path: nullableString(4096),
  })
  .passthrough();

/** 曲同期の配列 (1回の invoke の最大件数を制限) */
export const songsForSyncSchema = z.array(songForSyncSchema).max(10000);

/** プレイリストの同期ペイロード (PlaylistForSync) */
export const playlistForSyncSchema = z
  .object({
    id: syncIdSchema,
    title: z.string().max(1000).nullable().optional(),
    image_path: nullableString(MAX_URL_LENGTH),
    is_public: z.boolean().nullable().optional(),
    created_at: z.string().max(200).nullable().optional(),
    createdAt: z.string().max(200).nullable().optional(),
    user_id: z.union([z.string().max(128), z.number()]).nullable().optional(),
    user_name: z.string().max(500).nullable().optional(),
  })
  .passthrough();

/** プレイリスト同期の配列 */
export const playlistsForSyncSchema = z.array(playlistForSyncSchema).max(10000);

/** スポットライトの同期ペイロード (SpotlightForSync) */
export const spotlightForSyncSchema = z
  .object({
    id: syncIdSchema,
    title: z.string().max(1000).nullable().optional(),
    author: z.string().max(1000).nullable().optional(),
    description: nullableString(10000),
    genre: nullableString(200),
    video_path: nullableString(MAX_URL_LENGTH),
    thumbnail_path: nullableString(MAX_URL_LENGTH),
    created_at: z.string().max(200).nullable().optional(),
  })
  .passthrough();

/** スポットライト同期の配列 */
export const spotlightsForSyncSchema = z
  .array(spotlightForSyncSchema)
  .max(10000);

/** プレイリスト内の曲を同期するペイロード */
export const playlistSongsSyncSchema = z.object({
  playlistId: idSchema,
  songs: songsForSyncSchema,
});

/** いいね曲を同期するペイロード */
export const likedSongsSyncSchema = z.object({
  userId: idSchema,
  songs: songsForSyncSchema,
});

/** セクション順序を同期するペイロード ({id} の配列) */
export const sectionSyncSchema = z.object({
  key: z.string().min(1).max(200),
  data: z
    .array(z.object({ id: syncIdSchema }).passthrough())
    .max(10000),
});

/** セクションデータ取得のペイロード */
export const sectionQuerySchema = z.object({
  key: z.string().min(1).max(200),
  type: z.enum(["songs", "spotlights", "playlists"]),
});

/** ページネーション (offset/limit) */
export const paginationSchema = z.object({
  offset: z.number().int().nonnegative().max(1_000_000),
  limit: z.number().int().positive().max(1000),
});

/** ミニプレイヤーの再生状態 */
export const miniPlayerStateSchema = z.object({
  song: z
    .object({
      id: z.string().min(1).max(MAX_LOCAL_ID_LENGTH),
      title: z.string().max(1000),
      author: z.string().max(1000),
      image_path: z.string().max(MAX_URL_LENGTH).nullable(),
    })
    .nullable(),
  isPlaying: z.boolean(),
  theme: z
    .object({
      theme300: z.string().max(100),
      theme400: z.string().max(100),
      theme500: z.string().max(100),
      theme600: z.string().max(100),
      theme900: z.string().max(100),
    })
    .optional(),
});

/** ミニプレイヤーの操作アクション */
export const miniPlayerControlSchema = z.enum(["play-pause", "next", "previous"]);

/** Discord RPC のアクティビティ (DiscordRPC.Presence 相当) */
export const discordActivitySchema = z
  .object({
    details: z.string().max(128).optional(),
    state: z.string().max(128).optional(),
    startTimestamp: z.number().optional(),
    endTimestamp: z.number().optional(),
    largeImageKey: z.string().max(256).optional(),
    largeImageText: z.string().max(128).optional(),
    smallImageKey: z.string().max(256).optional(),
    smallImageText: z.string().max(128).optional(),
    instance: z.boolean().optional(),
  })
  .passthrough();

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
