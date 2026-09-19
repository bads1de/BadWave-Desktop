import { CHANNELS } from "../channels";
import { ipcMain } from "electron";
import * as fs from "fs";
import { validateInput, filePathSchema } from "../lib/ipc-validate";
import { assertAllowedMediaPath } from "../lib/path-guard";

export function setupDownloadHandlers() {
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
}
