import { CHANNELS } from "../channels";
import { ipcMain, dialog, BrowserWindow } from "electron";
import { allowDirectory } from "../lib/allowed-directories";

export function setupDialogHandlers() {
  // フォルダ選択ダイアログの表示
  ipcMain.handle(CHANNELS.SELECT_DIRECTORY, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);

    if (!win) {
      return { error: "Main window not available" };
    }

    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });

    if (result.canceled) {
      return { canceled: true };
    } else {
      const filePath = result.filePaths[0];
      // 以後のスキャンで許可するディレクトリとして記録する
      if (filePath) {
        allowDirectory(filePath);
      }
      return { filePath };
    }
  });
}
