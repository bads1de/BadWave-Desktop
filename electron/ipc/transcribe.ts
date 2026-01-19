import { ipcMain, app } from "electron";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";

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
    "transcribe:generate-lrc",
    async (_event, audioPath: string, lyricsText: string) => {
      return new Promise((resolve) => {
        // Python環境のパス解決
        const isDev = !app.isPackaged;
        let pythonPath = "";
        let scriptPath = "";

        if (isDev) {
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
          pythonPath = path.join(
            process.resourcesPath,
            "ai",
            "venv",
            "Scripts",
            "python.exe",
          );
          scriptPath = path.join(
            process.resourcesPath,
            "ai",
            "lrc_generator.py",
          );
        }

        console.log(`[Transcribe] Request - Path: ${audioPath}`);

        if (!fs.existsSync(pythonPath)) {
          return resolve({
            status: "error",
            message: `Python実行環境が見つかりません: ${pythonPath}`,
          });
        }

        // Python実行コア
        const runPython = (targetPath: string, isTemp: boolean = false) => {
          console.log(`[Transcribe] Executing Python with: ${targetPath}`);
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

          pythonProcess.on("close", (code) => {
            if (isTemp && fs.existsSync(targetPath)) {
              fs.unlink(targetPath, () => {});
            }

            if (code !== 0) {
              console.error(
                `[Transcribe] Python Error (code ${code}): ${stderr}`,
              );
              return resolve({
                status: "error",
                message: `トランスクライブエンジンの実行に失敗しました`,
              });
            }

            try {
              const result = JSON.parse(stdout.trim());
              resolve(result);
            } catch (e) {
              console.error(`[Transcribe] JSON Parse Error: ${stdout}`);
              resolve({
                status: "error",
                message: "トランスクライブエンジンの出力解析に失敗しました",
              });
            }
          });
        };

        // パス判定と処理開始
        const isUrl =
          audioPath.startsWith("http://") || audioPath.startsWith("https://");

        if (isUrl) {
          console.log(`[Transcribe] Remote URL detected. Downloading...`);
          const tempPath = path.join(
            app.getPath("temp"),
            `badwave_transcribe_${Date.now()}.mp3`,
          );
          const file = fs.createWriteStream(tempPath);
          const client = audioPath.startsWith("https") ? https : http;

          const request = client.get(audioPath, (response) => {
            if (response.statusCode !== 200) {
              file.close();
              fs.unlink(tempPath, () => {});
              return resolve({
                status: "error",
                message: `ファイルの取得に失敗しました(HTTP ${response.statusCode})`,
              });
            }
            response.pipe(file);
            file.on("finish", () => {
              file.close(() => runPython(tempPath, true));
            });
          });

          request.on("error", (err) => {
            file.close();
            if (fs.existsSync(tempPath)) fs.unlink(tempPath, () => {});
            resolve({ status: "error", message: `通信エラー: ${err.message}` });
          });
        } else {
          console.log(`[Transcribe] Local path detected.`);
          runPython(audioPath, false);
        }
      });
    },
  );
}
