import * as fs from "fs";
import * as http from "http";
import * as https from "https";

/** ダウンロードのタイムアウト (ms) */
const DOWNLOAD_TIMEOUT_MS = 30000;

/** 追従するリダイレクトのステータスコード */
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

export interface DownloadToFileOptions {
  /** タイムアウト (ms)。省略時は30秒 */
  timeoutMs?: number;
  /** 進捗 (0-100)。Content-Length が無いレスポンスでは呼ばれない */
  onProgress?: (percent: number) => void;
}

/**
 * URL からファイルをダウンロードして destPath に保存する。
 *
 * - http / https 両対応
 * - リダイレクト (301/302/303/307/308) を追従
 * - 失敗時は書きかけのファイルを削除する
 */
export function downloadToFile(
  url: string,
  destPath: string,
  options: DownloadToFileOptions = {},
): Promise<void> {
  const { timeoutMs = DOWNLOAD_TIMEOUT_MS, onProgress } = options;

  return new Promise<void>((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);

    // 失敗時: ハンドルを閉じてから書きかけのファイルを削除する
    // (Windows では開いたままのファイルを削除できないため)
    const removePartialFile = () => {
      file.close(() => fs.unlink(destPath, () => {}));
    };

    const request = client.get(url, (response) => {
      const statusCode = response.statusCode ?? 0;
      const redirectUrl = response.headers.location;

      if (REDIRECT_STATUS_CODES.has(statusCode) && redirectUrl) {
        // ハンドルを完全に閉じてから再帰的にダウンロードし直す
        // (Windows で同一パスを同時に開こうとすると EBUSY になるのを防ぐ)
        file.close(() => {
          downloadToFile(redirectUrl, destPath, options).then(resolve).catch(reject);
        });
        return;
      }

      if (statusCode !== 200) {
        removePartialFile();
        reject(
          new Error(`Download failed with status code: ${statusCode} for ${url}`),
        );
        return;
      }

      const totalSize = parseInt(response.headers["content-length"] || "0", 10);

      if (onProgress && totalSize > 0) {
        let downloadedSize = 0;
        response.on("data", (chunk: Buffer) => {
          downloadedSize += chunk.length;
          onProgress(Math.round((downloadedSize / totalSize) * 100));
        });
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close(() => resolve());
      });
    });

    request.on("error", (error) => {
      removePartialFile();
      reject(error);
    });

    request.setTimeout(timeoutMs, () => {
      request.destroy();
      removePartialFile();
      reject(new Error(`Download timeout for ${url}`));
    });
  });
}
