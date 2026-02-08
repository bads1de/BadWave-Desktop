import { ipcMain, BrowserWindow } from "electron";
import {
  getMiniPlayerWindow,
  createMiniPlayer,
  closeMiniPlayer,
  getMainWindow,
} from "../lib/window-manager";

/**
 * ミニプレイヤー関連のIPCハンドラーをセットアップ
 */
export function setupMiniPlayerHandlers() {
  // ミニプレイヤーを開く
  ipcMain.handle("mini-player:open", async () => {
    try {
      const miniPlayer = getMiniPlayerWindow();
      if (miniPlayer && !miniPlayer.isDestroyed()) {
        miniPlayer.show();
        miniPlayer.focus();
        // メインウィンドウに状態再送信をリクエスト
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("mini-player:request-state");
        }
        return { success: true };
      }

      await createMiniPlayer();

      // ミニプレイヤー作成後、メインウィンドウに状態再送信をリクエスト
      // 少し遅延させてミニプレイヤーのリスナーが準備できるようにする
      setTimeout(() => {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log("Requesting state sync from main window");
          mainWindow.webContents.send("mini-player:request-state");
        }
      }, 500);

      return { success: true };
    } catch (error) {
      console.error("ミニプレイヤーの作成に失敗:", error);
      return { success: false, error: String(error) };
    }
  });

  // ミニプレイヤーを閉じる
  ipcMain.handle("mini-player:close", (event) => {
    try {
      console.log("mini-player:close called");
      // event.senderからウィンドウを取得して閉じる（ミニプレイヤー自身から呼ばれた場合）
      const callerWindow = BrowserWindow.fromWebContents(event.sender);
      if (callerWindow && !callerWindow.isDestroyed()) {
        console.log("Closing mini-player window from caller");
        callerWindow.close();
        return { success: true };
      }

      // それ以外の場合は通常の閉じ方を試す
      closeMiniPlayer();
      return { success: true };
    } catch (error) {
      console.error("ミニプレイヤーの終了に失敗:", error);
      return { success: false, error: String(error) };
    }
  });

  // ミニプレイヤーの状態を更新（メインウィンドウからミニプレイヤーに曲情報を送る）
  ipcMain.handle(
    "mini-player:update-state",
    (
      _event,
      state: {
        song: {
          id: string;
          title: string;
          author: string;
          image_path: string | null;
        } | null;
        isPlaying: boolean;
      },
    ) => {
      try {
        const miniPlayer = getMiniPlayerWindow();
        if (miniPlayer && !miniPlayer.isDestroyed()) {
          miniPlayer.webContents.send("mini-player:state-changed", state);
        }
        return { success: true };
      } catch (error) {
        console.error("ミニプレイヤーの状態更新に失敗:", error);
        return { success: false, error: String(error) };
      }
    },
  );

  // ミニプレイヤーからの操作をメインウィンドウに転送
  ipcMain.handle(
    "mini-player:control",
    (_event, action: "play-pause" | "next" | "previous") => {
      try {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("media-control", action);
        }
        return { success: true };
      } catch (error) {
        console.error("メディアコントロールの転送に失敗:", error);
        return { success: false, error: String(error) };
      }
    },
  );

  // ミニプレイヤーが開いているか確認
  ipcMain.handle("mini-player:is-open", () => {
    const miniPlayer = getMiniPlayerWindow();
    return miniPlayer !== null && !miniPlayer.isDestroyed();
  });
}
