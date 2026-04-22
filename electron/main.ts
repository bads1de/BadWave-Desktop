import { app, BrowserWindow, globalShortcut } from "electron";
import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import { loadEnvVariables, debugLog } from "./utils";
import { getDb } from "./db/client";

// モジュールのインポート
import { registerProtocolHandlers, registerSchemes } from "./lib/protocol";
import { createMainWindow } from "./lib/window-manager";
import { setupTray, destroyTray } from "./lib/tray";

// カスタムプロトコルのスキームを登録（app ready前に必須）
registerSchemes();

// OAuthコールバック用のHTTPサーバー
let oauthServer: http.Server | null = null;

function startOAuthServer() {
  if (oauthServer) return;

  oauthServer = http.createServer((req, res) => {
    if (req.url?.startsWith("/auth/callback")) {
      const url = new URL(req.url, `http://localhost:4321`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      // 認証ページを返す
      const htmlPath = path.join(__dirname, "static", "auth-callback.html");
      const html = fs.readFileSync(htmlPath, "utf-8");

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);

      // 認証コードをIPC経由でメインウィンドウに送信
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (code) {
          mainWindow.webContents.send("auth-callback", { code });
        } else if (error) {
          mainWindow.webContents.send("auth-callback", { error });
        }
      }
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  oauthServer.listen(4321, () => {
    debugLog("[OAuth] HTTPサーバーがlocalhost:4321で起動しました");
  });
}

function stopOAuthServer() {
  if (oauthServer) {
    oauthServer.close(() => {
      debugLog("[OAuth] HTTPサーバーを停止しました");
    });
    oauthServer = null;
  }
}

// IPCハンドラーのインポート
import { setupOfflineDownloadHandlers } from "./ipc/offline";
import { setupSettingsHandlers } from "./ipc/settings";
import { setupWindowHandlers } from "./ipc/window";
import { setupDialogHandlers } from "./ipc/dialog";
import { setupLibraryHandlers } from "./ipc/library";
import { setupDownloadHandlers as setupSystemDownloadHandlers } from "./ipc/download";
import { setupCacheHandlers } from "./ipc/cache";
import { setupAuthHandlers } from "./ipc/auth";
import { setupDiscordHandlers } from "./ipc/discord";
import { setupTranscriptionHandlers } from "./ipc/transcribe";
import { setupMiniPlayerHandlers } from "./ipc/mini-player";
import { setupDevShortcuts } from "./shortcuts";
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
  setupCacheHandlers();

  // 認証キャッシュハンドラーのセットアップ
  setupAuthHandlers();

  // Discord RPCハンドラーのセットアップ
  setupDiscordHandlers();

  // トランスクライブ関連ハンドラーのセットアップ
  setupTranscriptionHandlers();

  // ミニプレイヤーハンドラーのセットアップ
  setupMiniPlayerHandlers();
}

// アプリケーションの準備完了時の処理
app.on("ready", async () => {
  await runMigrations();
  registerProtocolHandlers();
  setupIPC();

  // OAuthコールバック用のHTTPサーバーを起動
  startOAuthServer();

  const isDev = !app.isPackaged;
  debugLog(
    `isDev = ${isDev} process.env.NODE_ENV = ${process.env.NODE_ENV} app.isPackaged = ${app.isPackaged}`
  );

  if (isDev) {
    debugLog("開発モードで起動しています");
    debugLog("ローカル開発サーバー(http://localhost:3000)に接続を試みます...");
  } else {
    debugLog("本番モードで起動しています");
    createMainWindow();
  }

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
