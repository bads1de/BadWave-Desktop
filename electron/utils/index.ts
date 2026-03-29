import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

/**
 * file:// URLをローカルパスに変換するヘルパー
 * Node.jsの標準機能を使用してクロスプラットフォーム対応
 *
 * @param {string} fileUrl - 変換するファイルURL
 * @returns {string} ローカルファイルパス
 */
export const toLocalPath = (fileUrl: string): string => {
  try {
    // file:// プロトコルでない場合はそのまま返す
    if (!fileUrl.startsWith("file:")) {
      return fileUrl;
    }
    return fileURLToPath(fileUrl);
  } catch (e) {
    console.error(`Error converting file URL to path: ${fileUrl}`, e);
    return fileUrl;
  }
};

/**
 * .env.localファイルから環境変数を読み込む
 *
 * @returns {boolean} 環境変数の読み込みに成功したかどうか
 */
export function loadEnvVariables(): boolean {
  try {
    const envPath = path.join(app.getAppPath(), ".env.local");
    if (fs.existsSync(envPath)) {
      console.log("Loading environment variables from:", envPath);
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      for (const key in envConfig) {
        process.env[key] = envConfig[key];
      }
      return true;
    } else {
      console.warn(".env.localファイルが見つかりません:", envPath);
      return false;
    }
  } catch (error) {
    console.error("環境変数の読み込み中にエラーが発生しました:", error);
    return false;
  }
}

/**
 * 開発モードかどうかを判定
 */
export const isDev = !app.isPackaged;

/**
 * 条件付きでログを出力する
 * 開発モードの場合のみログを出力
 *
 * @param {string} message - ログメッセージ
 * @param {any[]} args - 追加の引数
 */
export function debugLog(message: string, ...args: any[]): void {
  if (isDev) {
    console.log(message, ...args);
  }
}

/**
 * DBの songs テーブルレコードをレンダラープロセス向けのレスポンス形式に変換する
 *
 * cache.ts・offline.ts の複数箇所で重複していたマッピングロジックを共通化。
 *
 * @param song - DBから取得した songs テーブルのレコード
 * @param overrides - created_at など、呼び出し元ごとに異なるフィールドの上書き
 * @returns レンダラープロセス向けの Song レスポンスオブジェクト
 */
export function mapDbSongToResponse(
  song: {
    id: string;
    userId: string | null;
    title: string;
    author: string;
    originalSongPath?: string | null;
    originalImagePath?: string | null;
    originalVideoPath?: string | null;
    songPath?: string | null;
    imagePath?: string | null;
    videoPath?: string | null;
    duration?: number | null;
    genre?: string | null;
    playCount?: number | null;
    likeCount?: number | null;
    lyrics?: string | null;
    createdAt?: string | null;
  },
  overrides?: {
    created_at?: string | null;
    user_id?: string;
  },
) {
  return {
    id: song.id,
    user_id: overrides?.user_id ?? song.userId ?? "",
    title: song.title,
    author: song.author,
    song_path: song.originalSongPath || null,
    image_path: song.originalImagePath || null,
    video_path: song.originalVideoPath || null,
    is_downloaded: !!song.songPath,
    local_song_path: song.songPath || null,
    local_image_path: song.imagePath || null,
    local_video_path: song.videoPath || null,
    duration: song.duration,
    genre: song.genre,
    count: String(song.playCount || 0),
    like_count: String(song.likeCount || 0),
    lyrics: song.lyrics || null,
    created_at: overrides?.created_at ?? song.createdAt ?? null,
  };
}
