import { CHANNELS } from "../channels";
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
  ipcMain.handle(CHANNELS.MINI_PLAYER_OPEN, async () => {
    try {
      await createMiniPlayer();

      // メインウィンドウに状態再送信をリクエスト（ウィンドウが新規作成されたかどうかにかかわらず実行）
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(CHANNELS.MINI_PLAYER_REQUEST_STATE);
      }

      return { success: true };
    } catch (error) {
      console.error("ミニプレイヤーの作成に失敗:", error);
      return { success: false, error: String(error) };
    }
  });

  // ミニプレイヤーを閉じる
  ipcMain.handle(CHANNELS.MINI_PLAYER_CLOSE, (event) => {
    try {
      // event.senderからウィンドウを取得して閉じる（ミニプレイヤー自身から呼ばれた場合）
      const callerWindow = BrowserWindow.fromWebContents(event.sender);
      if (callerWindow && !callerWindow.isDestroyed()) {
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
    CHANNELS.MINI_PLAYER_UPDATE_STATE,
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
          miniPlayer.webContents.send(CHANNELS.MINI_PLAYER_STATE_CHANGED, state);
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
    CHANNELS.MINI_PLAYER_CONTROL,
    (_event, action: "play-pause" | "next" | "previous") => {
      try {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(CHANNELS.MEDIA_CONTROL, action);
          return { success: true };
        } else {
          return { success: false, error: "Main window not available" };
        }
      } catch (error) {
        console.error("メディアコントロールの転送に失敗:", error);
        return { success: false, error: String(error) };
      }
    },
  );

  // ミニプレイヤーが開いているか確認
  ipcMain.handle(CHANNELS.MINI_PLAYER_IS_OPEN, () => {
    const miniPlayer = getMiniPlayerWindow();
    return miniPlayer !== null && !miniPlayer.isDestroyed();
  });

  // ミニプレイヤーの準備完了通知
  ipcMain.handle(CHANNELS.MINI_PLAYER_READY, () => {
    try {
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(CHANNELS.MINI_PLAYER_REQUEST_STATE);
      }
      return { success: true };
    } catch (error) {
      console.error("ミニプレイヤーの準備完了処理に失敗:", error);
      return { success: false, error: String(error) };
    }
  });
}
