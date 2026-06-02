import { ipcMain, shell, BrowserWindow } from "electron";
import Store from "electron-store";
import {
  validateInput,
  authUrlSchema,
  cachedUserSchema,
} from "../lib/ipc-validate";
import { getErrorMessage } from "../lib/error";

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
  ipcMain.handle("auth:start-google-oauth", async (_, rawAuthUrl: string) => {
    try {
      // URLインジェクション対策: Supabase/Googleの認証URLのみ許可
      const authUrl = validateInput(
        authUrlSchema,
        rawAuthUrl,
        "auth:start-google-oauth",
      );

      // デフォルトブラウザで認証URLを開く
      await shell.openExternal(authUrl);
      return { success: true };
    } catch (error: unknown) {
      console.error("[Auth] Failed to open auth URL:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  /**
   * 認証用BrowserWindowを開く
   */
  ipcMain.handle("auth:open-oauth-window", async (_, rawAuthUrl: string) => {
    try {
      // URLインジェクション対策
      const authUrl = validateInput(
        authUrlSchema,
        rawAuthUrl,
        "auth:open-oauth-window",
      );

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
        // セッションをリフレッシュして認ッシュして認証完了を検知
        mainWindow.webContents.send("auth-window-closed");
      });

      return { success: true };
    } catch (error: unknown) {
      console.error("[Auth] Failed to open auth window:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });

  /**
   * ユーザー情報をローカルに保存
   */
  ipcMain.handle("save-cached-user", async (_, rawUser: unknown) => {
    try {
      const user = validateInput(cachedUserSchema, rawUser, "save-cached-user");
      store.set("cachedUser", user);
      return { success: true };
    } catch (error: unknown) {
      console.error("[Auth] Failed to save user:", error);
      return { success: false, error: getErrorMessage(error) };
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
    } catch (error) {
      console.error("[Auth] Failed to clear cached user:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  });
}
