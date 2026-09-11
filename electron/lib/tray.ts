import { CHANNELS } from "../channels";
import { app, Tray, Menu, nativeImage } from "electron";
import * as path from "path";
import * as fs from "fs";
import { getMainWindow, createMainWindow, sendToMainWindow } from "./window-manager";

let tray: Tray | null = null;

/** メインウィンドウを表示する（未作成なら作成する） */
function showMainWindow() {
  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createMainWindow();
  }
}

/** 再生コントロールのメニュー項目 */
const MEDIA_MENU_ITEMS: Electron.MenuItemConstructorOptions[] = [
  {
    label: "再生/一時停止",
    click: () => sendToMainWindow(CHANNELS.MEDIA_CONTROL, "play-pause"),
  },
  {
    label: "次の曲",
    click: () => sendToMainWindow(CHANNELS.MEDIA_CONTROL, "next"),
  },
  {
    label: "前の曲",
    click: () => sendToMainWindow(CHANNELS.MEDIA_CONTROL, "previous"),
  },
];

/** アプリ表示・終了のメニュー項目 */
const APP_MENU_ITEMS: Electron.MenuItemConstructorOptions[] = [
  { label: "アプリを表示", click: showMainWindow },
  { label: "終了", click: () => app.quit() },
];

// システムトレイの設定
export function setupTray() {
  try {
    // 利用可能なすべてのパスを試す
    const possiblePaths = [];

    // 開発環境のパス
    const appPath = app.getAppPath();
    possiblePaths.push(path.join(appPath, "public", "logo.png"));

    // 本番環境の可能性のあるパス
    if (app.isPackaged) {
      const resourcePath = process.resourcesPath;
      const exePath = path.dirname(app.getPath("exe"));

      // リソースディレクトリ内のパス
      possiblePaths.push(
        path.join(resourcePath, "app.asar.unpacked", "public", "logo.png")
      );
      possiblePaths.push(
        path.join(resourcePath, "app.asar.unpacked", "build", "logo.png")
      );
      possiblePaths.push(path.join(resourcePath, "logo.png"));

      // 実行ファイルディレクトリ内のパス
      possiblePaths.push(path.join(exePath, "resources", "logo.png"));
      possiblePaths.push(
        path.join(
          exePath,
          "resources",
          "app.asar.unpacked",
          "public",
          "logo.png"
        )
      );
      possiblePaths.push(path.join(exePath, "public", "logo.png"));

      // その他の可能性のあるパス
      possiblePaths.push(path.join(resourcePath, "public", "logo.png"));
      possiblePaths.push(path.join(resourcePath, "..", "public", "logo.png"));
      possiblePaths.push(
        path.join(exePath, "..", "resources", "public", "logo.png")
      );
    }

    // 存在するパスを見つける
    let pngPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        pngPath = p;
        break;
      }
    }

    // ファイルの存在確認
    if (!pngPath || !fs.existsSync(pngPath)) {
      throw new Error(`アイコンファイルが見つかりません`);
    }

    // nativeImageを作成
    let icon;
    try {
      // ファイルの内容を読み込んでバッファとして保持
      const iconBuffer = fs.readFileSync(pngPath);

      // バッファからnativeImageを作成
      icon = nativeImage.createFromBuffer(iconBuffer);

      // アイコンが空でないか確認
      if (icon.isEmpty()) {
        throw new Error("アイコンイメージが空です");
      }

      // アイコンをリサイズ（システムトレイに適したサイズに）
      icon = icon.resize({
        width: 24,
        height: 24,
        quality: "best",
      });
    } catch (imgError) {
      // 代替方法: 組み込みのアイコンを使用
      try {
        // Electronの組み込みアイコンを使用
        const electronPath = require.resolve("electron");
        const electronDir = path.dirname(electronPath);
        const defaultIconPath = path.join(
          electronDir,
          "default_app.asar",
          "icon.png"
        );

        if (fs.existsSync(defaultIconPath)) {
          icon = nativeImage.createFromPath(defaultIconPath);
        } else {
          icon = nativeImage.createEmpty();
        }
      } catch (fallbackError) {
        // 最終手段: 空のイメージを作成
        icon = nativeImage.createEmpty();
      }
    }

    // トレイを作成
    tray = new Tray(icon);

    // コンテキストメニューを作成
    try {
      // メニューテンプレートを作成
      const menuTemplate: Electron.MenuItemConstructorOptions[] = [
        { label: "BadWave", enabled: false },
        { type: "separator" },
        ...MEDIA_MENU_ITEMS,
        { type: "separator" },
        ...APP_MENU_ITEMS,
      ];

      // メニューを構築
      const contextMenu = Menu.buildFromTemplate(menuTemplate);

      // トレイにメニューを設定
      tray.setToolTip("BadWave");
      tray.setContextMenu(contextMenu);

      // トレイアイコンのクリックでウィンドウを表示/非表示
      tray.on("click", () => {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          showMainWindow();
        }
      });
    } catch (menuError) {
      // エラーが発生した場合でもアプリケーションは続行
    }
  } catch (error) {
    // エラーが発生した場合でもアプリケーションは続行
    // 空のトレイオブジェクトを作成して最低限の機能を提供
    try {
      if (!tray) {
        // Base64エンコードされた最小限のアイコン（1x1ピクセルの透明PNG）
        const transparentPixel =
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const iconBuffer = Buffer.from(transparentPixel, "base64");

        try {
          const emptyIcon = nativeImage.createFromBuffer(iconBuffer);
          tray = new Tray(emptyIcon);
        } catch (iconError) {
          const emptyIcon = nativeImage.createEmpty();
          tray = new Tray(emptyIcon);
        }

        tray.setToolTip("BadWave");

        // 最小限のコンテキストメニュー
        const fallbackMenu = Menu.buildFromTemplate([
          { label: "BadWave", enabled: false },
          { type: "separator" },
          ...APP_MENU_ITEMS,
        ]);

        tray.setContextMenu(fallbackMenu);
      }
    } catch (fallbackError) {
      // フォールバックトレイの作成に失敗した場合も続行
    }
  }
}

// アプリ終了時にトレイを破棄
export function destroyTray() {
  if (tray) {
    tray.destroy();
  }
}
