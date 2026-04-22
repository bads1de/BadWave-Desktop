import { ipcMain, shell, BrowserWindow } from "electron";
import Store from "electron-store";

interface CachedUser {
  id: string;
  email: string | undefined;
  avatarUrl?: string;
}

const store = new Store<{ cachedUser: CachedUser | null }>();

export function setupAuthHandlers() {
  /**
   * 外部ブラウザでGoogle認証を開始
   */
  ipcMain.handle("auth:start-google-oauth", async (_, authUrl: string) => {
    try {
      // デフォルトブラウザで認証URLを開く
      await shell.openExternal(authUrl);
      return { success: true };
    } catch (error: any) {
      console.error("[Auth] Failed to open auth URL:", error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 認証用BrowserWindowを開く
   */
  ipcMain.handle("auth:open-oauth-window", async (_, authUrl: string) => {
    try {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        throw new Error("メインウィンドウが見つかりません");
      }

      // 認証用の小さなBrowserWindowを作成
      const authWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        show: false,
        width: 500,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      authWindow.once("ready-to-show", () => {
        authWindow.show();
      });

      authWindow.loadURL(authUrl);

      // 認証完了時にウィンドウを閉じる
      authWindow.webContents.on("will-navigate", (event, url) => {
        if (url.includes("/auth/callback")) {
          authWindow.close();
        }
      });

      authWindow.on("closed", () => {
        // セッションをリフレッシュして認証完了を検知
        mainWindow.webContents.send("auth-window-closed");
      });

      return { success: true };
    } catch (error: any) {
      console.error("[Auth] Failed to open auth window:", error);
      return { success: false, error: error.message };
    }
  });

  /**
   * ユーザー情報をローカルに保存
   */
  ipcMain.handle("save-cached-user", async (_, user: CachedUser) => {
    try {
      store.set("cachedUser", user);
      return { success: true };
    } catch (error: any) {
      console.error("[Auth] Failed to save user:", error);
      return { success: false, error: error.message };
    }
  });

  /**
   * ローカルに保存されたユーザー情報を取得
   */
  ipcMain.handle("get-cached-user", async () => {
    try {
      const user = store.get("cachedUser", null);
      return user;
    } catch (error) {
      console.error("[Auth] Failed to get cached user:", error);
      return null;
    }
  });

  /**
   * ローカルのユーザー情報をクリア（ログアウト時）
   */
  ipcMain.handle("clear-cached-user", async () => {
    try {
      store.delete("cachedUser");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
