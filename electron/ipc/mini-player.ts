import { CHANNELS } from "../channels";
import { ipcMain, BrowserWindow } from "electron";
import {
  getMiniPlayerWindow,
  createMiniPlayer,
  closeMiniPlayer,
  sendToMainWindow,
} from "../lib/window-manager";
import { validateInput, miniPlayerStateSchema, miniPlayerControlSchema } from "../lib/ipc-validate";
import { getErrorMessage } from "../lib/error";

/**
 * ミニプレイヤー関連のIPCハンドラーをセットアップ
 */
export function setupMiniPlayerHandlers() {
  // ミニプレイヤーを開く
  ipcMain.handle(CHANNELS.MINI_PLAYER_OPEN, async () => {
    try {
      await createMiniPlayer();

      // メインウィンドウに状態再送信をリクエスト（ウィンドウが新規作成されたかどうかにかかわらず実行）
      sendToMainWindow(CHANNELS.MINI_PLAYER_REQUEST_STATE);

      return { success: true };
    } catch (error) {
      console.error("ミニプレイヤーの作成に失敗:", error);
      return { success: false, error: getErrorMessage(error) };
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
      return { success: false, error: getErrorMessage(error) };
    }
  });

  // ミニプレイヤーの状態を更新（メインウィンドウからミニプレイヤーに曲情報を送る）
  ipcMain.handle(
    CHANNELS.MINI_PLAYER_UPDATE_STATE,
    (_event, rawState: unknown) => {
      try {
        const state = validateInput(
          miniPlayerStateSchema,
          rawState,
          CHANNELS.MINI_PLAYER_UPDATE_STATE,
        );
        const miniPlayer = getMiniPlayerWindow();
        if (miniPlayer && !miniPlayer.isDestroyed()) {
          miniPlayer.webContents.send(CHANNELS.MINI_PLAYER_STATE_CHANGED, state);
        }
        return { success: true };
      } catch (error) {
        console.error("ミニプレイヤーの状態更新に失敗:", error);
        return { success: false, error: getErrorMessage(error) };
      }
    },
  );

  // ミニプレイヤーからの操作をメインウィンドウに転送
  ipcMain.handle(
    CHANNELS.MINI_PLAYER_CONTROL,
    (_event, rawAction: unknown) => {
      try {
        const action = validateInput(
          miniPlayerControlSchema,
          rawAction,
          CHANNELS.MINI_PLAYER_CONTROL,
        );
        if (sendToMainWindow(CHANNELS.MEDIA_CONTROL, action)) {
          return { success: true };
        }
        return { success: false, error: "Main window not available" };
      } catch (error) {
        console.error("メディアコントロールの転送に失敗:", error);
        return { success: false, error: getErrorMessage(error) };
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
      sendToMainWindow(CHANNELS.MINI_PLAYER_REQUEST_STATE);
      return { success: true };
    } catch (error) {
      console.error("ミニプレイヤーの準備完了処理に失敗:", error);
      return { success: false, error: getErrorMessage(error) };
    }
  });
}
