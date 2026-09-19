import * as fs from "fs";
import * as path from "path";
import { SUPPORTED_AUDIO_EXTENSIONS } from "../constants";
import { MusicLibrary, FileMetadata } from "../../types/local";

// サポートされている音声ファイルの拡張子
const AUDIO_EXTENSION_SET = new Set(SUPPORTED_AUDIO_EXTENSIONS);

function isSupportedAudioFile(fileName: string): boolean {
  return AUDIO_EXTENSION_SET.has(path.extname(fileName).toLowerCase());
}

/**
 * スキャン進捗の型定義 (IPC で送信する)
 */
export interface ScanProgress {
  phase: "scanning" | "analyzing" | "metadata" | "complete";
  current: number;
  total: number;
  currentFile?: string;
  message: string;
}

/** スキャン結果に含まれるファイル情報 */
export interface LibraryScanFileInfo {
  path: string;
  metadata: FileMetadata | null;
  lastModified: number | null;
  needsMetadata: boolean;
}

/** 差分スキャンの分類結果 */
export interface LibraryScanInfo {
  newFiles: string[];
  modifiedFiles: string[];
  unchangedFiles: string[];
  deletedFiles: string[];
  isSameDirectory: boolean;
  isFullScan: boolean;
}

/** scanMusicLibrary の戻り値 */
export interface LibraryScanResult {
  /** ストアへ永続化するライブラリ情報 */
  currentLibrary: MusicLibrary;
  /** 収集した全ファイルパス */
  files: string[];
  /** メタデータ付きファイル情報 */
  filesWithMetadata: LibraryScanFileInfo[];
  /** 差分スキャンの分類結果 */
  scanInfo: LibraryScanInfo;
}

export interface LibraryScanOptions {
  /** 差分ではなく完全スキャンを行う */
  forceFullScan?: boolean;
  /**
   * 進捗コールバック。scanning / analyzing を通知する
   * (complete は呼び出し側が永続化後に通知する)
   */
  onProgress?: (progress: ScanProgress) => void;
}

/**
 * ディレクトリ内の対応音声ファイルを再帰的に収集する（シンボリックリンクループ保護付き）。
 * 実体パス (realpath) を visited に記録し、循環参照で無限ループしないようにする。
 */
async function collectAudioFiles(
  dir: string,
  visited: Set<string>,
): Promise<string[]> {
  const realDir = await fs.promises.realpath(dir);
  if (visited.has(realDir)) {
    return [];
  }
  visited.add(realDir);

  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // サブディレクトリを再帰的にスキャン
      files.push(...(await collectAudioFiles(fullPath, visited)));
    } else if (entry.isFile() && isSupportedAudioFile(entry.name)) {
      // サポートされている音声ファイルを追加
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 音楽ライブラリのディレクトリをスキャンし、差分分類まで行う純粋処理。
 *
 * 進捗 (scanning / analyzing) は options.onProgress に通知する。
 * ストアへの永続化・complete 通知・IPC レスポンス整形は呼び出し側 (IPC ハンドラ) が担う。
 *
 * @param directoryPath - スキャン対象ディレクトリ
 * @param prevLibrary - 前回のスキャン結果 (無ければ完全スキャン)
 * @param options - forceFullScan / onProgress
 */
export async function scanMusicLibrary(
  directoryPath: string,
  prevLibrary: MusicLibrary | undefined,
  options: LibraryScanOptions = {},
): Promise<LibraryScanResult> {
  const { forceFullScan = false, onProgress } = options;

  const isSameDirectory = prevLibrary?.directoryPath === directoryPath;
  const shouldPerformDiffScan = isSameDirectory && !forceFullScan;

  // 進捗: スキャン開始
  onProgress?.({
    phase: "scanning",
    current: 0,
    total: 0,
    message: "ファイルを検索中...",
  });

  const currentLibrary: MusicLibrary = {
    directoryPath,
    files: {},
  };

  // ディレクトリ内のすべての音声ファイルを取得
  const allFiles = await collectAudioFiles(directoryPath, new Set<string>());

  // 進捗: ファイル検索完了、分類開始
  onProgress?.({
    phase: "analyzing",
    current: 0,
    total: allFiles.length,
    message: `${allFiles.length}個のファイルを分析中...`,
  });

  // 新しいファイル、変更されたファイル、変更なしのファイルを分類
  const newFiles: string[] = [];
  const modifiedFiles: string[] = [];
  const unchangedFiles: string[] = [];

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const stats = await fs.promises.stat(filePath);
    const lastModified = stats.mtimeMs;

    // 100ファイルごとに進捗を更新（パフォーマンス考慮）
    if (i % 100 === 0 || i === allFiles.length - 1) {
      onProgress?.({
        phase: "analyzing",
        current: i + 1,
        total: allFiles.length,
        currentFile: path.basename(filePath),
        message: `ファイルを分析中... (${i + 1}/${allFiles.length})`,
      });
    }

    if (shouldPerformDiffScan && prevLibrary?.files[filePath]) {
      // 前回のスキャン結果と比較
      const savedFile = prevLibrary.files[filePath];

      if (savedFile.lastModified === lastModified) {
        // ファイルが変更されていない場合は前回のメタデータを再利用
        unchangedFiles.push(filePath);
        currentLibrary.files[filePath] = savedFile;
      } else {
        // ファイルが変更されている場合は新しいエントリを作成 (メタデータは後で取得)
        modifiedFiles.push(filePath);
        currentLibrary.files[filePath] = { lastModified };
      }
    } else {
      // 新しいファイルの場合
      newFiles.push(filePath);
      currentLibrary.files[filePath] = { lastModified };
    }
  }

  // 削除されたファイルを特定（前回のスキャン結果にあるが今回のスキャンにないファイル）
  const deletedFiles: string[] = [];
  if (shouldPerformDiffScan && prevLibrary) {
    const allFilesSet = new Set(allFiles); // O(1)検索のためSetを使用
    for (const filePath in prevLibrary.files) {
      if (!allFilesSet.has(filePath)) {
        deletedFiles.push(filePath);
      }
    }
  }

  // キャッシュ済みメタデータも一緒に返す（フロントエンドでの個別IPC呼び出しを削減）
  const filesWithMetadata: LibraryScanFileInfo[] = allFiles.map((filePath) => {
    const fileInfo = currentLibrary.files[filePath];
    return {
      path: filePath,
      metadata: fileInfo?.metadata || null,
      lastModified: fileInfo?.lastModified ?? null,
      needsMetadata: !fileInfo?.metadata,
    };
  });

  return {
    currentLibrary,
    files: allFiles,
    filesWithMetadata,
    scanInfo: {
      newFiles,
      modifiedFiles,
      unchangedFiles,
      deletedFiles,
      isSameDirectory,
      isFullScan: !shouldPerformDiffScan,
    },
  };
}
