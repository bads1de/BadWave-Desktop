import { CHANNELS } from "../channels";
import { ipcMain, shell, BrowserWindow } from "electron";
import {
  validateInput,
  authUrlSchema,
  cachedUserSchema,
} from "../lib/ipc-validate";
import { getErrorMessage } from "../lib/error";
import store from "../lib/store";
import {
  getMainWindow,
  sendToMainWindow,
  SECURE_WEB_PREFERENCES,
} from "../lib/window-manager";
import type { CachedUser } from "../../types/local";

export function setupAuthHandlers() {
  /**
   * 外部ブラウザでGoogle認証を開始
   */
  ipcMain.handle(CHANNELS.START_GOOGLE_OAUTH, async (_, rawAuthUrl: string) => {
    try {
      // URLインジェクション対策: Supabase/Googleの認証URLのみ許可
      const authUrl = validateInput(
        authUrlSchema,
        rawAuthUrl,
        CHANNELS.START_GOOGLE_OAUTH,
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
  ipcMain.handle(CHANNELS.OPEN_OAUTH_WINDOW, async (_, rawAuthUrl: string) => {
    try {
      // URLインジェクション対策
      const authUrl = validateInput(
        authUrlSchema,
        rawAuthUrl,
        CHANNELS.OPEN_OAUTH_WINDOW,
      );

      const mainWindow = getMainWindow();
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
        webPreferences: { ...SECURE_WEB_PREFERENCES },
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
        // 認証ウィンドウが閉じられたことをレンダラーに通知（認証完了の検知用）
        sendToMainWindow(CHANNELS.AUTH_WINDOW_CLOSED);
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
  ipcMain.handle(CHANNELS.SAVE_CACHED_USER, async (_, rawUser: unknown) => {
    try {
      const user = validateInput(cachedUserSchema, rawUser, CHANNELS.SAVE_CACHED_USER);
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
  ipcMain.handle(CHANNELS.GET_CACHED_USER, async () => {
    try {
      const user = store.get("cachedUser", null) as CachedUser | null;
      return user;
    } catch (error) {
      console.error("[Auth] Failed to get cached user:", error);
      return null;
    }
  });

  /**
   * ローカルのユーザー情報をクリア（ログアウト時）
   */
  ipcMain.handle(CHANNELS.CLEAR_CACHED_USER, async () => {
    try {
      store.delete("cachedUser");
      return { success: true };
    } catch (error) {
      console.error("[Auth] Failed to clear cached user:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });
}
