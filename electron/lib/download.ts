import * as fs from "fs";
import * as http from "http";
import * as https from "https";

/** ダウンロードのタイムアウト (ms) */
const DOWNLOAD_TIMEOUT_MS = 30000;

/** 追従するリダイレクトのステータスコード */
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

/** 追従するリダイレクトの最大回数（リダイレクトループ対策） */
const MAX_REDIRECTS = 5;

export interface DownloadToFileOptions {
  /** タイムアウト (ms)。省略時は30秒 */
  timeoutMs?: number;
  /** 進捗 (0-100)。Content-Length が無いレスポンスでは呼ばれない */
  onProgress?: (percent: number) => void;
  /** 内部用: 追従済みのリダイレクト回数（呼び出し側では指定しない） */
  redirectCount?: number;
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
  const {
    timeoutMs = DOWNLOAD_TIMEOUT_MS,
    onProgress,
    redirectCount = 0,
  } = options;

  return new Promise<void>((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);

    // リダイレクト再帰後は旧リスナーを無効化する。
    // 旧ストリームの error/timeout が生きたままだと、成果物を消したり
    // 外側の Promise を誤 reject してしまう
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    // 失敗時: ハンドルを閉じてから書きかけのファイルを削除する
    // (Windows では開いたままのファイルを削除できないため)
    const removePartialFile = () => {
      file.close(() => fs.unlink(destPath, () => {}));
    };

    // 書き込みストリームの失敗（権限なし・容量不足・パス不正など）を拾う。
    // リスナーが無いと未処理の 'error' イベントでメインプロセスが落ちる
    file.on("error", (error) => {
      settle(() => {
        removePartialFile();
        reject(error);
      });
    });

    const request = client.get(url, (response) => {
      // ダウンロード中に接続が切れた場合も 'error' が発火する。
      // リスナーが無いと未処理イベントになり、Promise も未解決のまま残る
      response.on("error", (error) => {
        settle(() => {
          removePartialFile();
          reject(error);
        });
      });

      const statusCode = response.statusCode ?? 0;
      const redirectUrl = response.headers.location;

      if (REDIRECT_STATUS_CODES.has(statusCode) && redirectUrl) {
        // リダイレクトループで無限に再帰しないよう上限を設ける
        if (redirectCount >= MAX_REDIRECTS) {
          settle(() => {
            removePartialFile();
            reject(new Error(`Too many redirects for ${url}`));
          });
          return;
        }

        // 旧リスナーを無効化してからリクエストを破棄し、再帰先の結果で外側を settle する
        // (Windows で同一パスを同時に開こうとすると EBUSY になるのを防ぐため file.close 後に再帰)
        settled = true;
        request.destroy();
        response.destroy();
        const nextOptions = { ...options, redirectCount: redirectCount + 1 };
        file.close(() => {
          downloadToFile(redirectUrl, destPath, nextOptions)
            .then(resolve)
            .catch(reject);
        });
        return;
      }

      if (statusCode !== 200) {
        settle(() => {
          removePartialFile();
          reject(
            new Error(
              `Download failed with status code: ${statusCode} for ${url}`,
            ),
          );
        });
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
        settle(() => {
          file.close(() => resolve());
        });
      });
    });

    request.on("error", (error) => {
      settle(() => {
        removePartialFile();
        reject(error);
      });
    });

    request.setTimeout(timeoutMs, () => {
      settle(() => {
        request.destroy();
        removePartialFile();
        reject(new Error(`Download timeout for ${url}`));
      });
    });
  });
}
