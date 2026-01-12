import { ipcMain, BrowserWindow } from "electron";

export function setupWindowHandlers() {
  // ウィンドウ制御
  ipcMain.handle("window-minimize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  // 最大化/復元
  ipcMain.handle("window-maximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  // ウィンドウを閉じる
  ipcMain.handle("window-close", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    // アプリケーションの仕様として、closeではなくhideする場合が多いが
    // main.tsの実装に合わせて hide() を呼ぶ
    win?.hide();
  });
}
