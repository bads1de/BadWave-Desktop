import { CHANNELS } from "../channels";
import { ipcMain, app } from "electron";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import {
  validateInput,
  audioPathSchema,
  lyricsTextSchema,
} from "../lib/ipc-validate";
import { assertAllowedAudioPath } from "../lib/path-guard";
import { downloadToFile } from "../lib/download";
import { getErrorMessage } from "../lib/error";
import { debugLog } from "../utils";

/**
 * トランスクライブ関連のIPCハンドラーをセットアップする
 */
export function setupTranscriptionHandlers() {
  /**
   * LRC生成リクエスト
   * @param audioPath 音声ファイルのパス（ローカルまたはURL）
   * @param lyricsText 歌詞テキスト
   */
  ipcMain.handle(
    CHANNELS.GENERATE_LRC,
    async (_event, rawAudioPath: string, rawLyricsText: string) => {
      return new Promise((resolve) => {
        // 入力検証: 長さ制限と基本型チェック
        let audioPath: string;
        let lyricsText: string;
        try {
          audioPath = validateInput(
            audioPathSchema,
            rawAudioPath,
            "transcribe:generate-lrc:audioPath",
          );
          lyricsText = validateInput(
            lyricsTextSchema,
            rawLyricsText,
            "transcribe:generate-lrc:lyricsText",
          );
        } catch (validationError) {
          // バリデーション失敗は例外ではなく { success: false, error } 形式で返す
          console.error("[Transcribe] Invalid input:", validationError);
          resolve({
            success: false,
            error: getErrorMessage(validationError, "Invalid input"),
          });
          return;
        }
        // Python環境のパス解決
        const isDev = !app.isPackaged;
        let pythonPath = "";
        let scriptPath = "";

        if (isDev) {
          // 開発時: python/venv を使用
          const rootDir = path.join(__dirname, "../..");
          pythonPath = path.join(
            rootDir,
            "python",
            "venv",
            "Scripts",
            "python.exe",
          );
          scriptPath = path.join(rootDir, "python", "lrc_generator.py");
        } else {
          // 本番時: resources/python を使用 (Embedded Python)
          pythonPath = path.join(process.resourcesPath, "python", "python.exe");
          scriptPath = path.join(
            process.resourcesPath,
            "python",
            "lrc_generator.py",
          );
        }

        debugLog(`[Transcribe] Request - Path: ${audioPath}`);

        // Python実行環境の存在確認
        if (!fs.existsSync(pythonPath)) {
          console.error("[Transcribe] Python runtime not found:", pythonPath);
          return resolve({
            success: false,
            error: `Python実行環境が見つかりません: ${pythonPath}`,
          });
        }

        // Python実行コア
        const runPython = (targetPath: string, isTemp: boolean = false) => {
          debugLog(`[Transcribe] Executing Python with: ${targetPath}`);
          const pythonProcess = spawn(pythonPath, [
            scriptPath,
            targetPath,
            lyricsText,
          ]);

          let stdout = "";
          let stderr = "";

          pythonProcess.stdout.on("data", (data) => {
            stdout += data.toString();
          });
          pythonProcess.stderr.on("data", (data) => {
            stderr += data.toString();
          });

          // spawn 自体に失敗した場合（実行権限なし等）は 'close' が来ない上、
          // リスナーが無いと未処理の 'error' でメインプロセスが落ちる
          pythonProcess.on("error", (error) => {
            console.error("[Transcribe] Failed to spawn python process:", error);
            resolve({
              success: false,
              error: `トランスクライブエンジンの起動に失敗しました: ${getErrorMessage(error)}`,
            });
          });

          pythonProcess.on("close", (code) => {
            if (isTemp && fs.existsSync(targetPath)) {
              fs.unlink(targetPath, () => {});
            }

            if (code !== 0) {
              console.error(
                `[Transcribe] Python Error (code ${code}): ${stderr}`,
              );
              return resolve({
                success: false,
                error: `トランスクライブエンジンの実行に失敗しました`,
              });
            }

            try {
              const result = JSON.parse(stdout.trim());
              // Python 側は { status, lrc } 形式で返すため、共通の { success, error } に正規化する
              if (result?.status === "success") {
                resolve({ success: true, lrc: result.lrc });
              } else {
                resolve({
                  success: false,
                  error:
                    typeof result?.message === "string"
                      ? result.message
                      : "トランスクライブエンジンが失敗しました",
                });
              }
            } catch (e) {
              console.error(`[Transcribe] JSON Parse Error: ${stdout}`);
              resolve({
                success: false,
                error: "トランスクライブエンジンの出力解析に失敗しました",
              });
            }
          });
        };

        // パス判定と処理開始
        const isUrl =
          audioPath.startsWith("http://") || audioPath.startsWith("https://");

        if (isUrl) {
          debugLog(`[Transcribe] Remote URL detected. Downloading...`);
          const tempPath = path.join(
            app.getPath("temp"),
            `badwave_transcribe_${Date.now()}.mp3`,
          );

          downloadToFile(audioPath, tempPath)
            .then(() => runPython(tempPath, true))
            .catch((error: unknown) => {
              console.error("[Transcribe] Failed to download remote audio:", error);
              resolve({
                success: false,
                error: `ファイルの取得に失敗しました: ${getErrorMessage(error)}`,
              });
            });
        } else {
          debugLog(`[Transcribe] Local path detected.`);

          // パストラバーサル・拡張子チェック (不正な場合は throw → reject)
          assertAllowedAudioPath(audioPath);

          runPython(audioPath, false);
        }
      });
    },
  );
}
