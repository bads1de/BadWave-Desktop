import * as path from "path";

/** ユーザーがディレクトリ選択ダイアログで承認したディレクトリ */
const allowedDirectories = new Set<string>();

function normalizeDirectoryPath(directoryPath: string): string {
  const resolved = path.resolve(directoryPath);
  // Windows のパスは大文字小文字を区別しない
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

/** ダイアログで選択されたディレクトリを許可リストに追加する */
export function allowDirectory(directoryPath: string): void {
  allowedDirectories.add(normalizeDirectoryPath(directoryPath));
}

/** 許可済みディレクトリかどうか */
export function isDirectoryAllowed(directoryPath: string): boolean {
  return allowedDirectories.has(normalizeDirectoryPath(directoryPath));
}

/** 2つのパスが同一ディレクトリを指すか */
export function isSameDirectoryPath(a: string, b: string): boolean {
  return normalizeDirectoryPath(a) === normalizeDirectoryPath(b);
}
