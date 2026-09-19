import { CHANNELS } from "../channels";
import { ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as mm from "music-metadata";
import store from "../lib/store";
import { debugLog } from "../utils";
import { sendToMainWindow } from "../lib/window-manager";
import { validateInput, filePathSchema } from "../lib/ipc-validate";
import { MusicLibrary, FileMetadata } from "../../types/local";
import { getErrorMessage } from "../lib/error";
import { SUPPORTED_AUDIO_EXTENSIONS, ELECTRON_STORE_KEYS } from "../constants";
import { scanMusicLibrary } from "../lib/library-scan";
import type { ScanProgress } from "../lib/library-scan";

export type { ScanProgress } from "../lib/library-scan";

// サポートされている音声ファイルの拡張子
const AUDIO_EXTENSION_SET = new Set(SUPPORTED_AUDIO_EXTENSIONS);

function isSupportedAudioFile(fileName: string): boolean {
  return AUDIO_EXTENSION_SET.has(path.extname(fileName).toLowerCase());
}

// 音楽ライブラリのデータを保存するためのストアキー
const MUSIC_LIBRARY_KEY = ELECTRON_STORE_KEYS.MUSIC_LIBRARY;
const MUSIC_LIBRARY_LAST_SCAN_KEY = ELECTRON_STORE_KEYS.MUSIC_LIBRARY_LAST_SCAN;

/**
 * スキャン進捗をフロントエンドに送信するヘルパー関数
 */
function sendScanProgress(progress: ScanProgress) {
  sendToMainWindow(CHANNELS.SCAN_PROGRESS, progress);
}

export function setupLibraryHandlers() {
  /** 保存済みの音楽ライブラリを取得する */
  const getSavedLibrary = (): MusicLibrary | undefined =>
    store.get(MUSIC_LIBRARY_KEY) as MusicLibrary | undefined;

  // 指定されたフォルダ内のMP3ファイルをスキャン（永続化対応版）
  ipcMain.handle(
    CHANNELS.SCAN_MP3_FILES,
    async (_, directoryPath: string, forceFullScan: boolean = false) => {
      try {
        // 前回のスキャン結果を取得
        const savedLibrary = getSavedLibrary();
        const isSameDirectory = savedLibrary?.directoryPath === directoryPath;

        // 差分スキャンを行うかどうかを決定
        const shouldPerformDiffScan = isSameDirectory && !forceFullScan;

        debugLog(
          `[Scan] スキャン開始: ${directoryPath} (差分スキャン: ${shouldPerformDiffScan})`
        );

        // スキャン本体は純粋関数に委譲する（進捗は scanning / analyzing を通知）
        const result = await scanMusicLibrary(directoryPath, savedLibrary, {
          forceFullScan,
          onProgress: sendScanProgress,
        });

        // スキャン結果をストアに保存
        store.set(MUSIC_LIBRARY_KEY, result.currentLibrary);
        store.set(MUSIC_LIBRARY_LAST_SCAN_KEY, new Date().toISOString());

        debugLog(
          `[Scan] スキャン完了: 新規=${result.scanInfo.newFiles.length}, 変更=${result.scanInfo.modifiedFiles.length}, 変更なし=${result.scanInfo.unchangedFiles.length}, 削除=${result.scanInfo.deletedFiles.length}`
        );

        // 進捗: スキャン完了
        sendScanProgress({
          phase: "complete",
          current: result.files.length,
          total: result.files.length,
          message: `スキャン完了: ${result.files.length}ファイルを処理しました`,
        });

        // スキャン結果を返す (キャッシュ済みメタデータも含む)
        return {
          files: result.files,
          filesWithMetadata: result.filesWithMetadata,
          scanInfo: result.scanInfo,
        };
      } catch (error: unknown) {
        debugLog(
          `[Error] MP3ファイルのスキャンに失敗: ${directoryPath}`,
          error
        );
        return { error: getErrorMessage(error) };
      }
    }
  );

  // 保存されている音楽ライブラリデータを取得
  ipcMain.handle(CHANNELS.GET_SAVED_MUSIC_LIBRARY, async () => {
    try {
      const savedLibrary = getSavedLibrary();
      const lastScan = store.get(MUSIC_LIBRARY_LAST_SCAN_KEY) as
        | string
        | undefined;

      if (!savedLibrary) {
        return { exists: false };
      }

      // ディレクトリが存在するか確認
      let directoryExists = false;
      try {
        await fs.promises.access(savedLibrary.directoryPath);
        directoryExists = true;
      } catch (e) {
        // ディレクトリが存在しない場合
        directoryExists = false;
      }

      return {
        exists: true,
        directoryPath: savedLibrary.directoryPath,
        fileCount: Object.keys(savedLibrary.files).length,
        lastScan,
        directoryExists,
      };
    } catch (error: unknown) {
      debugLog(`[Error] 保存された音楽ライブラリの取得に失敗:`, error);
      return { error: getErrorMessage(error) };
    }
  });

  // キャッシュ済みのファイルリスト+メタデータを取得（スキャンなし）
  // ページ遷移時の高速ロード用
  ipcMain.handle(CHANNELS.GET_CACHED_FILES_WITH_METADATA, async () => {
    try {
      const savedLibrary = getSavedLibrary();
      const lastScan = store.get(MUSIC_LIBRARY_LAST_SCAN_KEY) as
        | string
        | undefined;

      if (!savedLibrary || Object.keys(savedLibrary.files).length === 0) {
        return { exists: false, files: [] };
      }

      // キャッシュ済みのファイルリスト+メタデータを構築
      const filesWithMetadata = Object.entries(savedLibrary.files).map(
        ([filePath, fileInfo]) => ({
          path: filePath,
          metadata: fileInfo.metadata || null,
          lastModified: fileInfo.lastModified ?? null,
        })
      );

      return {
        exists: true,
        directoryPath: savedLibrary.directoryPath,
        files: filesWithMetadata,
        lastScan,
      };
    } catch (error: unknown) {
      debugLog(`[Error] キャッシュ済みファイルの取得に失敗:`, error);
      return { error: getErrorMessage(error), exists: false, files: [] };
    }
  });

  // MP3ファイルのメタデータを取得
  // 注意: このハンドラーは個別のファイルに対して呼ばれるため、
  // ストアへの書き込みは遅延させてバッチ処理する
  let pendingMetadataUpdates: Map<
    string,
    { metadata: FileMetadata; lastModified: number }
  > = new Map();
  let saveTimeout: NodeJS.Timeout | null = null;

  const debouncedSaveLibrary = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      if (pendingMetadataUpdates.size > 0) {
        const savedLibrary = getSavedLibrary();
        if (savedLibrary) {
          pendingMetadataUpdates.forEach((update, filePath) => {
            if (!savedLibrary.files[filePath]) {
              savedLibrary.files[filePath] = {
                lastModified: update.lastModified,
              };
            }
            savedLibrary.files[filePath].metadata = update.metadata;
            savedLibrary.files[filePath].lastModified = update.lastModified;
            delete savedLibrary.files[filePath].error;
          });
          store.set(MUSIC_LIBRARY_KEY, savedLibrary);
          debugLog(
            `[Store] メタデータを保存: ${pendingMetadataUpdates.size}件`
          );
        }
        pendingMetadataUpdates.clear();
      }
      saveTimeout = null;
    }, 1000); // 1秒間の遅延でバッチ保存
  };

  ipcMain.handle(CHANNELS.GET_MP3_METADATA, async (_, rawFilePath: string) => {
    // パストラバーサル対策: 絶対パスのみ許可、長さ制限
    const filePath = validateInput(
      filePathSchema,
      rawFilePath,
      CHANNELS.GET_MP3_METADATA,
    );

    // 拡張子チェック: サポートされている音声ファイルのみ
    if (!isSupportedAudioFile(filePath)) {
      return { error: "Unsupported file extension" };
    }

    try {

      // 保存されているライブラリデータを取得
      const savedLibrary = getSavedLibrary();

      // ファイルの最終更新日時を取得
      const stats = await fs.promises.stat(filePath);
      const lastModified = stats.mtimeMs;

      // 保存されているメタデータがあり、ファイルが変更されていない場合は保存されているメタデータを返す
      if (
        savedLibrary &&
        savedLibrary.files[filePath] &&
        savedLibrary.files[filePath].metadata &&
        savedLibrary.files[filePath].lastModified === lastModified
      ) {
        return {
          metadata: savedLibrary.files[filePath].metadata,
          fromCache: true,
        };
      }

      // メタデータを取得
      const metadata = await mm.parseFile(filePath);

      // ペンディングキューに追加（即座に保存しない）
      pendingMetadataUpdates.set(filePath, { metadata: metadata as unknown as FileMetadata, lastModified });

      // 遅延保存をスケジュール
      debouncedSaveLibrary();

      return { metadata: metadata as unknown as FileMetadata, fromCache: false };
    } catch (error: unknown) {
      debugLog(`[Error] メタデータの取得に失敗: ${filePath}`, error);
      const message = getErrorMessage(error);

      // エラー情報をライブラリデータに保存
      const savedLibrary = getSavedLibrary();
      if (savedLibrary && savedLibrary.files[filePath]) {
        savedLibrary.files[filePath].error = message;
        store.set(MUSIC_LIBRARY_KEY, savedLibrary);
      }

      return { error: message };
    }
  });
}
