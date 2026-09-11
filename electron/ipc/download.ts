import { CHANNELS } from "../channels";
import { ipcMain, app } from "electron";
import * as fs from "fs";
import * as path from "path";
import { debugLog } from "../utils";
import {
  validateInput,
  externalUrlSchema,
  filenameSchema,
  filePathSchema,
} from "../lib/ipc-validate";
import { downloadToFile } from "../lib/download";
import { assertAllowedMediaPath } from "../lib/path-guard";

/** ダウンロード保存先ディレクトリ (userData/downloads) */
const getDownloadsDir = () => path.join(app.getPath("userData"), "downloads");

export function setupDownloadHandlers() {
  // 曲のダウンロード
  // 注意: offline.tsのsetupDownloadHandlersとチャンネル名が重複する可能性があります
  // どちらか一方のみを使用してください
  ipcMain.handle(
    "download-song-simple", // チャンネル名を変更して競合を回避
    async (event, rawUrl: string, rawFilename: string) => {
      // SSRF対策: 任意URLを排除 (http/httpsのみ)
      const url = validateInput(externalUrlSchema, rawUrl, "download-song-simple:url");
      // パストラバーサル対策
      const filename = validateInput(
        filenameSchema,
        rawFilename,
        "download-song-simple:filename",
      );

      const downloadsDir = getDownloadsDir();

      // ダウンロードフォルダがなければ作成
      if (!fs.existsSync(downloadsDir)) {
        await fs.promises.mkdir(downloadsDir, { recursive: true });
      }

      const filePath = path.join(downloadsDir, filename);
      debugLog(`[Download] Starting download: ${url} -> ${filePath}`);

      await downloadToFile(url, filePath, {
        onProgress: (progress) => {
          event.sender.send(CHANNELS.DOWNLOAD_PROGRESS, progress);
        },
      });

      debugLog(`[Download] Completed: ${filePath}`);
      return filePath;
    },
  );

  // ファイル存在確認
  ipcMain.handle(CHANNELS.CHECK_FILE_EXISTS, async (_, rawFilename: string) => {
    const filename = validateInput(filenameSchema, rawFilename, CHANNELS.CHECK_FILE_EXISTS);
    const filePath = path.join(getDownloadsDir(), filename);
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  // ローカルファイルの存在確認（任意パス）
  // 注意: 任意の絶対パスを許可するため、Renderer 側の信頼性に依存
  ipcMain.handle(CHANNELS.CHECK_LOCAL_FILE_EXISTS, async (_, rawFilePath: string) => {
    const filePath = validateInput(filePathSchema, rawFilePath, CHANNELS.CHECK_LOCAL_FILE_EXISTS);

    // パストラバーサル・拡張子チェック
    assertAllowedMediaPath(filePath);

    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  });

  // ローカルファイルのパスを取得
  ipcMain.handle(CHANNELS.GET_LOCAL_FILE_PATH, (_, rawFilename: string) => {
    const filename = validateInput(filenameSchema, rawFilename, CHANNELS.GET_LOCAL_FILE_PATH);
    // appプロトコルで読めるように絶対パスを返す
    return path.join(getDownloadsDir(), filename);
  });

  // ファイル削除
  ipcMain.handle(CHANNELS.DELETE_SONG, async (_, rawFilename: string) => {
    const filename = validateInput(filenameSchema, rawFilename, CHANNELS.DELETE_SONG);
    const filePath = path.join(getDownloadsDir(), filename);
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      debugLog(`[Delete] Error:`, error);
      return false;
    }
  });
}
