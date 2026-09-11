import * as path from "path";
import {
  ALLOWED_MEDIA_EXTENSIONS,
  SUPPORTED_AUDIO_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
} from "../constants";

const ALLOWED_MEDIA = new Set(ALLOWED_MEDIA_EXTENSIONS);
const ALLOWED_AUDIO_VIDEO = new Set(
  SUPPORTED_AUDIO_EXTENSIONS.concat(SUPPORTED_VIDEO_EXTENSIONS),
);

const INVALID_PATH_MESSAGE = "Invalid path or unsupported file extension";

/**
 * ディレクトリトラバーサル (`..`) を含むパスかどうか。
 * 正規化前後の両方で判定する。
 */
export function hasPathTraversal(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  const traversalPattern = /(\/|\\)\.\.(\/|\\|$)/;
  return (
    filePath.includes("..") ||
    normalized.includes("..") ||
    traversalPattern.test(filePath) ||
    traversalPattern.test(normalized)
  );
}

function assertAllowedFile(filePath: string, allowed: Set<string>): void {
  const ext = path.extname(filePath).toLowerCase();
  if (hasPathTraversal(filePath) || !allowed.has(ext)) {
    throw new Error(INVALID_PATH_MESSAGE);
  }
}

/** 音声・動画・画像ファイルとして安全なパスであることを検証する */
export function assertAllowedMediaPath(filePath: string): void {
  assertAllowedFile(filePath, ALLOWED_MEDIA);
}

/** 音声ファイル (動画コンテナ含む) として安全なパスであることを検証する */
export function assertAllowedAudioPath(filePath: string): void {
  assertAllowedFile(filePath, ALLOWED_AUDIO_VIDEO);
}
