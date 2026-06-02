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
                  event.sender.send("download-progress", progress);
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
  ipcMain.handle("check-file-exists", async (_, rawFilename: string) => {
    const filename = validateInput(filenameSchema, rawFilename, "check-file-exists");
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
  // TODO: 許可ディレクトリを userData とユーザーが選択した音楽ディレクトリに限定
  ipcMain.handle("check-local-file-exists", async (_, rawFilePath: string) => {
    const filePath = validateInput(filePathSchema, rawFilePath, "check-local-file-exists");
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  });

  // ローカルファイルのパスを取得
  ipcMain.handle("get-local-file-path", (_, rawFilename: string) => {
    const filename = validateInput(filenameSchema, rawFilename, "get-local-file-path");
    const userDataPath = app.getPath("userData");
    // appプロトコルで読めるように絶対パスを返す
    return path.join(userDataPath, "downloads", filename);
  });

  // ファイル削除
  ipcMain.handle("delete-song", async (_, rawFilename: string) => {
    const filename = validateInput(filenameSchema, rawFilename, "delete-song");
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
