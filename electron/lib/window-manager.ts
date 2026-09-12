import { BrowserWindow, shell, app, screen } from "electron";
import * as path from "path";
import { isDev, debugLog } from "../utils";
import { startNextServer, stopNextServer } from "./server";
import { setupThumbBar } from "./thumbbar";

// グローバル参照を保持（ガベージコレクションを防ぐため）
let mainWindow: BrowserWindow | null = null;
let miniPlayerWindow: BrowserWindow | null = null;

/** preload スクリプトの絶対パス（全ウィンドウで共有） */
const PRELOAD_PATH = path.join(__dirname, "../preload/index.js");

/**
 * レンダラーに公開する最小構成の webPreferences。
 * IPC は preload の contextBridge 経由のみ許可する。
 */
export const SECURE_WEB_PREFERENCES = {
  nodeIntegration: false,
  contextIsolation: true,
} as const;

// メインウィンドウの取得
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

// ミニプレイヤーウィンドウの取得
export function getMiniPlayerWindow(): BrowserWindow | null {
  return miniPlayerWindow;
}

/**
 * メインウィンドウの webContents に送信する。
 * ウィンドウが未生成・破棄済みの場合は何もせず false を返す。
 */
export function sendToMainWindow(channel: string, ...args: unknown[]): boolean {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) return false;

  win.webContents.send(channel, ...args);
  return true;
}

/**
 * 起動失敗時などに表示するエラーページを data URL として生成する
 */
function errorPageDataUrl(heading: string, messages: string[]): string {
  const paragraphs = messages.map((message) => `<p>${message}</p>`).join("");
  return (
    "data:text/html;charset=utf-8," +
    encodeURIComponent(
      `<html>
        <head><style>body{background:#121212;color:#fff;font-family:sans-serif;padding:40px;}</style></head>
        <body>
          <h1>${heading}</h1>
          ${paragraphs}
        </body>
      </html>`,
    )
  );
}

// ミニプレイヤーウィンドウの作成
export async function createMiniPlayer(): Promise<BrowserWindow> {
  // 既存のミニプレイヤーがあれば表示して返す
  if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
    miniPlayerWindow.show();
    miniPlayerWindow.focus();
    return miniPlayerWindow;
  }

  // 画面サイズを取得して右下に配置
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  const miniPlayerWidth = 380;
  const miniPlayerHeight = 100;
  const margin = 20;

  miniPlayerWindow = new BrowserWindow({
    width: miniPlayerWidth,
    height: miniPlayerHeight,
    x: screenWidth - miniPlayerWidth - margin,
    y: screenHeight - miniPlayerHeight - margin,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: false,
    hasShadow: true,
    // アプリ本体と同じサーフェス色（読み込み中の白フラッシュも防ぐ）
    backgroundColor: "#0a0a0f",
    webPreferences: {
      ...SECURE_WEB_PREFERENCES,
      preload: PRELOAD_PATH,
      backgroundThrottling: true,
    },
  });

  // ミニプレイヤー専用HTMLファイルを読み込む
  const htmlPath = path.join(app.getAppPath(), "public", "mini-player.html");

  await miniPlayerWindow.loadFile(htmlPath);

  // ウィンドウが閉じられたときの処理
  miniPlayerWindow.on("closed", () => {
    miniPlayerWindow = null;
  });
  return miniPlayerWindow;
}

// ミニプレイヤーウィンドウを閉じる
export function closeMiniPlayer(): void {
  if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
    miniPlayerWindow.close();
    miniPlayerWindow = null;
  }
}

// メインウィンドウの作成
export async function createMainWindow() {
  const isMac = process.platform === "darwin";

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      ...SECURE_WEB_PREFERENCES,
      preload: PRELOAD_PATH,
      // =========================================================================
      // ✅ webSecurity: true（カスタムプロトコル方式に移行済み）
      // =========================================================================
      //
      // 以前の課題:
      //   webSecurity: false でローカルファイルを直接読み込んでいた
      //   → 同一生成元ポリシー無効化、CORSスキップ、ローカルファイルアクセス可能
      //
      // 現在の解決策:
      //   カスタムプロトコル `badwave://` を使用して安全にローカルファイルにアクセス
      //   例: <audio src="badwave://C:/Users/buti3/Music/song.mp3" />
      //
      // プロトコル登録:
      //   electron/lib/protocol.ts で `badwave://` プロトコルを登録済み
      //   パストラバーサル攻撃防止（".." を含むパスを拒否）
      //   プロトコルは `secure: true`, `supportFetchAPI: true` で登録
      //
      // 使用方法（Rendererプロセス）:
      //   1. ローカルファイルパスを badwave:// に変換
      //      const badwaveUrl = `badwave://${encodeURIComponent(filePath)}`;
      //   2. <audio> タグで使用
      //      <audio src={badwaveUrl} />
      // =========================================================================
      webSecurity: true, // カスタムプロトコル方式のため有効
      backgroundThrottling: true, // JSタイマー/rAFのみスロットリング（<audio>再生には影響なし）
    },
    // macOSでは背景色を設定しないとタイトルバーが白くなる
    backgroundColor: "#121212",
    // タイトルバーをカスタマイズ
    titleBarStyle: isMac ? "hiddenInset" : "default",
    // Windowsではフレームレスにする
    frame: isMac ? true : false,
    // アプリケーションアイコンを設定
    icon: path.join(__dirname, "../../public/logo.png"),
  });

  // 開発モードの場合
  if (isDev) {
    debugLog(
      `isDev = ${isDev}, process.env.NODE_ENV = ${process.env.NODE_ENV}, app.isPackaged = ${app.isPackaged}`,
    );
    debugLog("開発モードで起動しています");
    mainWindow.webContents.openDevTools();

    try {
      // 開発サーバーが起動しているか確認
      // 注: wait-on パッケージが npm スクリプトでサーバーの準備を待機するので、
      // ここでは単純に loadURL を呼び出すだけでOK
      debugLog(
        "ローカル開発サーバー(http://localhost:3000)に接続を試みます...",
      );
      await mainWindow.loadURL("http://localhost:3000");
      debugLog("開発サーバーに接続しました");
    } catch (err) {
      console.error("開発サーバーへの接続に失敗しました:", err);
      // 開発モードでは開発サーバーが必須
      await mainWindow.loadURL(
        errorPageDataUrl("開発サーバーに接続できません", [
          "別のターミナルで <code>npm run dev</code> を実行してから、アプリを再起動してください。",
        ]),
      );
    }
  }
  // 本番モードの場合: Standaloneサーバーを起動
  else {
    debugLog("本番モードで起動しています - Standaloneサーバーを起動します");
    mainWindow.webContents.closeDevTools();

    try {
      // Next.js Standaloneサーバーを起動
      const port = await startNextServer();
      debugLog(`Standaloneサーバーがポート ${port} で起動しました`);

      // ローカルサーバーに接続
      await mainWindow.loadURL(`http://localhost:${port}`);
      debugLog("Standaloneサーバーに接続しました");
    } catch (err) {
      console.error("Standaloneサーバーの起動に失敗しました:", err);
      await mainWindow.loadURL(
        errorPageDataUrl("アプリケーションの起動に失敗しました", [
          "アプリケーションを再インストールしてください。",
          `エラー: ${err}`,
        ]),
      );
    }
  }

  // ウィンドウが閉じられたときの処理
  mainWindow.on("closed", () => {
    mainWindow = null;
    // 本番モードの場合、サーバーも停止
    if (!isDev) {
      stopNextServer();
    }
  });

  // Windowsタスクバーのサムネイルツールバーを設定
  setupThumbBar(mainWindow);

  return mainWindow;
}
