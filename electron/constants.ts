/**
 * メインプロセス / レンダラーで共有する定数の一元管理。
 *
 * - メインプロセス: このファイルを直接 import する
 * - レンダラー: `constants/index.ts` が再エクスポートしたものを import する
 *
 * electron/tsconfig.json の rootDir 制約で electron 側から `constants/` を
 * 参照できないため、共有する定数は electron 側に置く。
 */

/**
 * メディア拡張子と MIME タイプの対応表。
 *
 * 拡張子リストはこの表を唯一のソースとして導出する (二重管理を防ぐ)。
 * 新しい形式を追加する場合はここに 1 行足すだけでよい。
 */
export const MEDIA_MIME_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".opus": "audio/opus",
  ".m4a": "audio/mp4",
  ".wma": "audio/x-ms-wma",
  ".alac": "audio/mp4",
  ".aiff": "audio/aiff",
  ".webm": "audio/webm",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  // オフラインDL用画像
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** MIME タイプの前方一致で拡張子リストを導出する */
function extensionsOf(kind: string): string[] {
  return Object.keys(MEDIA_MIME_TYPES).filter(
    (ext) => MEDIA_MIME_TYPES[ext].indexOf(kind) === 0,
  );
}

/** サポートされている音声ファイルの拡張子 */
export const SUPPORTED_AUDIO_EXTENSIONS = extensionsOf("audio/");

/** サポートされている動画ファイルの拡張子 */
export const SUPPORTED_VIDEO_EXTENSIONS = extensionsOf("video/");

/** サポートされている画像ファイルの拡張子（オフラインDL用） */
export const SUPPORTED_IMAGE_EXTENSIONS = extensionsOf("image/");

/** 許可されるメディアファイルの拡張子（音声 + 動画 + 画像） */
export const ALLOWED_MEDIA_EXTENSIONS = Object.keys(MEDIA_MIME_TYPES);

/**
 * electron-store のキー。
 * レンダラーは `store.get/set` の IPC 経由でこれらを参照する。
 */
export const ELECTRON_STORE_KEYS = {
  VOLUME: "player_volume",
  RIGHT_SIDEBAR_WIDTH: "right_sidebar_width",
  RIGHT_SIDEBAR_CLOSED: "right_sidebar_closed",
  MUSIC_LIBRARY: "music_library",
  MUSIC_LIBRARY_LAST_SCAN: "music_library_last_scan",
} as const;
