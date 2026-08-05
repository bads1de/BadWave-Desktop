import { CHANNELS } from "../channels";
import { ipcMain, app } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { debugLog } from "../utils";
import {
  validateInput,
  externalUrlSchema,
  filenameSchema,
  filePathSchema,
} from "../lib/ipc-validate";

export function setupDownloadHandlers() {
  // 曲のダウンロード
  // 注意: offline.tsのsetupDownloadHandlersとチャンネル名が重複する可能性があります
  // どちらか一方のみを使用してください
  ipcMain.handle(
    "download-song-simple", // チャンネル名を変更して競合を回避
    async (event, rawUrl: string, rawFilename: string) => {
      try {
        // SSRF対策: 任意URLを排除 (http/httpsのみ)
        const url = validateInput(externalUrlSchema, rawUrl, "download-song-simple:url");
        // パストラバーサル対策
        const filename = validateInput(
          filenameSchema,
          rawFilename,
          "download-song-simple:filename",
        );

        const userDataPath = app.getPath("userData");
        const downloadsDir = path.join(userDataPath, "downloads");

        // ダウンロードフォルダがなければ作成
        if (!fs.existsSync(downloadsDir)) {
          await fs.promises.mkdir(downloadsDir, { recursive: true });
        }

        const filePath = path.join(downloadsDir, filename);
        debugLog(`[Download] Starting download: ${url} -> ${filePath}`);

        return new Promise((resolve, reject) => {
          const file = fs.createWriteStream(filePath);

          https
            .get(url, (response) => {
              if (response.statusCode !== 200) {
                fs.unlink(filePath, () => {}); // ゴミ掃除
                reject(new Error(`Status Code: ${response.statusCode}`));
                return;
              }

              const totalSize = parseInt(
                response.headers["content-length"] || "0",
                10,
              );
              let downloadedSize = 0;

              response.on("data", (chunk) => {
                downloadedSize += chunk.length;
                if (totalSize > 0) {
                  const progress = Math.round(
                    (downloadedSize / totalSize) * 100,
                  );
                  // 進捗を送信
                  event.sender.send(CHANNELS.DOWNLOAD_PROGRESS, progress);
                }
              });

              response.pipe(file);

              file.on("finish", () => {
                file.close(() => {
                  debugLog(`[Download] Completed: ${filePath}`);
                  resolve(filePath);
                });
              });
            })
            .on("error", (err) => {
              fs.unlink(filePath, () => {});
              reject(err);
            });
        });
      } catch (error) {
        debugLog(`[Download] Error:`, error);
        throw error;
      }
    },
  );

  // ファイル存在確認
  ipcMain.handle(CHANNELS.CHECK_FILE_EXISTS, async (_, rawFilename: string) => {
    const filename = validateInput(filenameSchema, rawFilename, CHANNELS.CHECK_FILE_EXISTS);
    const userDataPath = app.getPath("userData");
    const filePath = path.join(userDataPath, "downloads", filename);
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

    // 安全なパスと拡張子のチェック
    const ALLOWED_EXTENSIONS = new Set([
      ".mp3", ".wav", ".flac", ".aac", ".ogg", ".opus", ".m4a", ".wma",
      ".alac", ".aiff", ".webm", ".mp4", ".m4v", ".avi", ".mkv",
      ".jpg", ".jpeg", ".png", ".webp",
    ]);
    const normalized = path.normalize(filePath);
    const ext = path.extname(normalized).toLowerCase();

    if (
      filePath.includes("..") ||
      normalized.includes("..") ||
      /(\/|\\)\.\.(\/|\\|$)/.test(filePath) ||
      !ALLOWED_EXTENSIONS.has(ext)
    ) {
      throw new Error("Invalid path or unsupported file extension");
    }

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
    const userDataPath = app.getPath("userData");
    // appプロトコルで読めるように絶対パスを返す
    return path.join(userDataPath, "downloads", filename);
  });

  // ファイル削除
  ipcMain.handle(CHANNELS.DELETE_SONG, async (_, rawFilename: string) => {
    const filename = validateInput(filenameSchema, rawFilename, CHANNELS.DELETE_SONG);
    const userDataPath = app.getPath("userData");
    const filePath = path.join(userDataPath, "downloads", filename);
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      debugLog(`[Delete] Error:`, error);
      return false;
    }
  });
}
