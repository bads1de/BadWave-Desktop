import { app, BrowserWindow, globalShortcut, session } from "electron";
import { loadEnvVariables, debugLog } from "./utils";
import { getDb } from "./db/client";

// モジュールのインポート
import { registerProtocolHandlers, registerSchemes } from "./lib/protocol";
import { createMainWindow } from "./lib/window-manager";
import { setupTray, destroyTray } from "./lib/tray";
import { startOAuthServer, stopOAuthServer } from "./lib/oauth-server";

// カスタムプロトコルのスキームを登録（app ready前に必須）
registerSchemes();

// IPCハンドラーのインポート
import { setupOfflineDownloadHandlers } from "./ipc/offline";
import { setupSettingsHandlers } from "./ipc/settings";
import { setupWindowHandlers } from "./ipc/window";
import { setupDialogHandlers } from "./ipc/dialog";
import { setupLibraryHandlers } from "./ipc/library";
import { setupDownloadHandlers as setupSystemDownloadHandlers } from "./ipc/download";
import { setupSyncHandlers } from "./ipc/sync";
import { setupQueryHandlers } from "./ipc/queries";
import { setupMutationHandlers } from "./ipc/mutations";
import { setupAuthHandlers } from "./ipc/auth";
import { setupDiscordHandlers } from "./ipc/discord";
import { setupTranscriptionHandlers } from "./ipc/transcribe";
import { setupMiniPlayerHandlers } from "./ipc/mini-player";
import { setupDevShortcuts } from "./shortcuts";
import { setupThumbBarHandlers } from "./lib/thumbbar";
import { runMigrations } from "./db/migrate";

// 環境変数を読み込む
loadEnvVariables();

// プラットフォーム判定
const isMac = process.platform === "darwin";

// IPC通信のセットアップ
function setupIPC() {
  // 設定ハンドラーのセットアップ
  setupSettingsHandlers();

  // ウィンドウ制御ハンドラーのセットアップ
  setupWindowHandlers();

  // ダイアログハンドラーのセットアップ
  setupDialogHandlers();

  // ライブラリハンドラーのセットアップ
  setupLibraryHandlers();

  // システムダウンロードハンドラーのセットアップ
  setupSystemDownloadHandlers();

  // オフラインダウンロードハンドラーのセットアップ
  setupOfflineDownloadHandlers();

  // キャッシュハンドラーのセットアップ（オフラインライブラリ表示用）
  setupSyncHandlers();
  setupQueryHandlers();
  setupMutationHandlers();

  // 認証キャッシュハンドラーのセットアップ
  setupAuthHandlers();

  // Discord RPCハンドラーのセットアップ
  setupDiscordHandlers();

  // トランスクライブ関連ハンドラーのセットアップ
  setupTranscriptionHandlers();

  // ミニプレイヤーハンドラーのセットアップ
  setupMiniPlayerHandlers();

  // サムネイルツールバー（タスクバー再生コントロール）ハンドラーのセットアップ
  setupThumbBarHandlers();
}

// アプリケーションの準備完了時の処理
app.on("ready", async () => {
  await runMigrations();
  registerProtocolHandlers();
  setupIPC();

  // OAuthコールバック用のHTTPサーバーを起動
  startOAuthServer();

  // 外部リソース（R2ストレージなど）のCORSヘッダーを強制追加
  // 本番ではNext.jsが動的ポート（13000など）で起動するため、
  // Cloudflare R2のCORSポリシーにブロックされる問題を回避する
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };

    // セキュリティ向上のため、Supabase/R2ストレージのドメインに対してのみCORSを許可する
    const isR2Resource = details.url.includes(".r2.dev");

    if (isR2Resource) {
      // 既存のヘッダーがあっても強制的に書き換える（キャッシュによるポート不一致などを防ぐため）
      headers["Access-Control-Allow-Origin"] = ["*"];
      headers["Access-Control-Allow-Methods"] = ["GET, HEAD, OPTIONS"];
      headers["Access-Control-Allow-Headers"] = ["*"];
    }
    callback({ responseHeaders: headers });
  });

  const isDev = !app.isPackaged;
  debugLog(
    `isDev = ${isDev} process.env.NODE_ENV = ${process.env.NODE_ENV} app.isPackaged = ${app.isPackaged}`
  );

  if (isDev) {
    debugLog("開発モードで起動しています");
    debugLog("ローカル開発サーバー(http://localhost:3000)に接続を試みます...");
  } else {
    debugLog("本番モードで起動しています");
  }
  createMainWindow();

  setupTray();
  setupDevShortcuts();
});

// すべてのウィンドウが閉じられたときの処理
app.on("window-all-closed", () => {
  if (!isMac) {
    destroyTray();
    app.quit();
  }
});

// アプリケーションがアクティブ化されたときの処理（macOS）
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// アプリケーション終了時にショートカットを解除
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  stopOAuthServer();
});
