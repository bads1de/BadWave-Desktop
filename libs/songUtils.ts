import { Song, SongWithRecommendation } from "@/types";
import { SUPPORTED_AUDIO_EXTENSIONS } from "@/constants";

/**
 * 曲がローカルファイルかどうかを判定する
 *
 * 注意: この関数はsong.idが'local_'で始まるかどうかで判定します。
 * これにより、キャッシュされたオンライン曲（song_pathがローカルパスに変更されている）と
 * 本当のローカルファイル（/localページからスキャンしたMP3など）を正しく区別できます。
 *
 * @param song - 判定する曲オブジェクト
 * @returns ローカルファイルの場合true
 */
export function isLocalSong(song: Song | null | undefined): boolean {
  if (!song) {
    return false;
  }

  // IDが'local_'で始まる場合は本当のローカルファイル
  // キャッシュされたオンライン曲はオリジナルのIDを保持しているため、falseを返す
  return typeof song.id === "string" && song.id.startsWith("local_");
}

/**
 * song_pathがローカルファイルパスかどうかを判定する
 * （内部使用: オーディオ再生時のURL変換に使用）
 *
 * @param songPath - 曲のパス
 * @returns ローカルファイルパスの場合true
 */
export function isLocalFilePath(songPath: string | null | undefined): boolean {
  if (!songPath) {
    return false;
  }

  // HTTPまたはHTTPSで始まる場合はオンラインパス
  if (songPath.startsWith("http://") || songPath.startsWith("https://")) {
    return false;
  }

  // file:// または badwave:// で始まる場合はローカルファイルパス
  if (songPath.startsWith("file://") || songPath.startsWith("badwave://")) {
    return true;
  }

  // ローカルファイルパス（Windows: C:\, Unix: /）の場合
  const isWindowsPath = /^[A-Za-z]:\\/.test(songPath);
  const isUnixPath = songPath.startsWith("/");

  return isWindowsPath || isUnixPath;
}

// 許可されるメディアファイルの拡張子（音声 + 動画 + 画像）
const ALLOWED_MEDIA_EXTENSIONS = new Set(
  SUPPORTED_AUDIO_EXTENSIONS.concat([
    ".mp4", ".m4v", ".avi", ".mkv",
    ".jpg", ".jpeg", ".png", ".webp",
  ]),
);

/**
 * ローカルファイルパスが安全かどうかを検証する
 *
 * @param filePath - 検証するファイルパス
 * @returns 安全な場合true
 */
export function isValidLocalFilePath(filePath: string): boolean {
  // ディレクトリトラバーサル対策
  if (filePath.includes("..")) {
    return false;
  }

  // 拡張子チェック（音声/動画ファイルのみ許可）
  const extMatch = filePath.match(/\.[^.]+$/);
  if (!extMatch) {
    return false;
  }
  const ext = extMatch[0].toLowerCase();
  if (!ALLOWED_MEDIA_EXTENSIONS.has(ext)) {
    return false;
  }

  return true;
}

/**
 * ローカルファイルパスをbadwave://スキーマ付きのURLに変換する
 *
 * @param filePath - ローカルファイルパス
 * @returns badwave://スキーマ付きのURL（検証失敗時は空文字）
 */
export function toFileUrl(filePath: string): string {
  if (!filePath) {
    return "";
  }

  if (filePath.startsWith("badwave://")) {
    return filePath;
  }

  if (filePath.startsWith("file://")) {
    // file:// を badwave:// に変換する
    let rawPath = filePath.replace("file://", "");
    if (rawPath.startsWith("/") && /^[A-Za-z]:/.test(rawPath.substring(1))) {
      rawPath = rawPath.substring(1);
    }
    if (!isValidLocalFilePath(rawPath)) {
      console.warn("Blocked invalid local file path:", rawPath);
      return "";
    }
    return `badwave://file/${encodeURIComponent(rawPath)}`;
  }

  // パス検証
  if (!isValidLocalFilePath(filePath)) {
    console.warn("Blocked invalid local file path:", filePath);
    return "";
  }

  return `badwave://file/${encodeURIComponent(filePath)}`;
}

/**
 * ローカル曲用のIDを生成する
 *
 * @param filePath - ファイルパス
 * @returns ローカル曲用のID
 */
export function generateLocalSongId(filePath: string): string {
  // ファイルパスをBase64エンコードしてプレフィックスを付ける
  const encoded = btoa(encodeURIComponent(filePath));
  return `local_${encoded}`;
}

/**
 * ローカル曲のIDからファイルパスを復元する
 *
 * @param localId - ローカル曲のID
 * @returns ファイルパス
 */
export function extractFilePathFromLocalId(localId: string): string | null {
  if (!localId.startsWith("local_")) {
    return null;
  }

  try {
    const encoded = localId.substring(6); // 'local_'を除去
    const decoded = atob(encoded);
    return decodeURIComponent(decoded);
  } catch (error) {
    console.error("Failed to decode local song ID:", error);
    return null;
  }
}

/**
 * ダウンロード用のファイル名を生成する
 *
 * @param song - 曲オブジェクト
 * @returns ファイルファイル名 (例: Title-ID.mp3)
 */
export function getDownloadFilename(song: Song): string {
  // ファイルシステムで使用できない文字を置換
  const safeTitle = song.title
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${safeTitle}-${song.id}.mp3`;
}

/**
 * 曲の再生可能なパスを取得する
 *
 * ダウンロード済みの場合はローカルパスを優先し、
 * そうでなければリモートURLを返す。
 * オフライン時に通信を発生させないための重要な関数。
 *
 * @param song - 曲オブジェクト
 * @returns 再生可能なパス（ローカルまたはリモート）
 */
export function getPlayablePath(song: Song | null | undefined): string {
  if (!song) {
    return "";
  }

  // ダウンロード済みかつローカルパスが存在する場合はローカルパスを使用
  if (song.is_downloaded && song.local_song_path) {
    const localUrl = toFileUrl(song.local_song_path);
    if (localUrl) return localUrl;
  }

  // それ以外の場合はリモートURLを使用
  return song.song_path || "";
}

export function getPlayableImagePath(song: Song | null | undefined): string {
  if (!song) {
    return "";
  }

  // ダウンロード済みかつローカル画像パスが存在する場合はそれを使用
  if (song.is_downloaded && song.local_image_path) {
    const localUrl = toFileUrl(song.local_image_path);
    if (localUrl) return localUrl;
  }

  const imagePath = song.image_path || "";

  // 以前のストア等に残っている file:/// パスなどを無効化（セキュリティエラー回避）
  // http:// はそのまま通す
  if (imagePath.startsWith("file://") || /^[A-Za-z]:\\/.test(imagePath)) {
    return "";
  }

  return imagePath;
}

/**
 * SongWithRecommendation を Song に変換する
 *
 * useGetRecommendations と useSyncRecommendations で重複していたマッピングを共通化。
 *
 * @param item - おすすめ曲データ
 * @param userId - ユーザーID
 * @returns Song オブジェクト
 */
export function mapRecommendationToSong(
  item: SongWithRecommendation,
  userId: string,
): Song {
  return {
    id: item.id,
    title: item.title,
    author: item.author,
    song_path: item.song_path,
    image_path: item.image_path,
    genre: item.genre,
    count: item.count,
    like_count: item.like_count,
    created_at: item.created_at,
    user_id: userId,
  };
}

/**
 * JOIN クエリ（liked_songs / playlist_songs と songs の JOIN）の結果から Song 配列を抽出する
 *
 * useGetLikedSongs, useGetPlaylistSongs, useSyncLikedSongs, useSyncPlaylistSongs で
 * 重複していた `data.map((item) => ({ ...item.songs, songType: "regular" }))` を共通化。
 *
 * @param data - Supabase JOIN クエリの結果
 * @returns Song 配列
 */
export function extractSongsFromJoin(data: Record<string, any>[]): Song[] {
  return data.map((item) => ({
    ...item.songs,
    songType: "regular" as const,
  })) as Song[];
}
