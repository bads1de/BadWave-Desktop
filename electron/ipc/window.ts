import { CHANNELS } from "../channels";
import { ipcMain, BrowserWindow } from "electron";

export function setupWindowHandlers() {
  // ウィンドウ制御
  ipcMain.handle(CHANNELS.WINDOW_MINIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  // 最大化/復元
  ipcMain.handle(CHANNELS.WINDOW_MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  // ウィンドウを閉じる
  ipcMain.handle(CHANNELS.WINDOW_CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    // アプリケーションの仕様として、closeではなくhideする場合が多いが
    // main.tsの実装に合わせて hide() を呼ぶ
    win?.hide();
  });
}
