import { isElectron } from "./common";

/**
 * ミニプレイヤーの曲情報
 */
export interface MiniPlayerSong {
  id: string;
  title: string;
  author: string;
  image_path: string | null;
}

/**
 * ミニプレイヤーの状態
 */
export interface MiniPlayerState {
  song: MiniPlayerSong | null;
  isPlaying: boolean;
}

/**
 * ミニプレイヤー関連の操作
 */
export const miniPlayer = {
  /**
   * ミニプレイヤーを開く
   */
  open: async (): Promise<{ success: boolean; error?: string }> => {
    if (!isElectron()) {
      return { success: false, error: "Electron環境ではありません" };
    }
    try {
      return await window.electron.miniPlayer.open();
    } catch (error) {
      console.error("ミニプレイヤーを開く際にエラー:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * ミニプレイヤーを閉じる
   */
  close: async (): Promise<{ success: boolean; error?: string }> => {
    if (!isElectron()) {
      return { success: false, error: "Electron環境ではありません" };
    }
    try {
      return await window.electron.miniPlayer.close();
    } catch (error) {
      console.error("ミニプレイヤーを閉じる際にエラー:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * ミニプレイヤーの状態を更新
   */
  updateState: async (
    state: MiniPlayerState,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isElectron()) {
      return { success: false, error: "Electron環境ではありません" };
    }
    try {
      return await window.electron.miniPlayer.updateState(state);
    } catch (error) {
      console.error("ミニプレイヤーの状態更新に失敗:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * ミニプレイヤーから再生コントロール
   */
  control: async (
    action: "play-pause" | "next" | "previous",
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isElectron()) {
      return { success: false, error: "Electron環境ではありません" };
    }
    try {
      return await window.electron.miniPlayer.control(action);
    } catch (error) {
      console.error("ミニプレイヤーのコントロールに失敗:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * ミニプレイヤーが開いているか確認
   */
  isOpen: async (): Promise<boolean> => {
    if (!isElectron()) {
      return false;
    }
    try {
      return await window.electron.miniPlayer.isOpen();
    } catch (error) {
      console.error("ミニプレイヤーの状態確認に失敗:", error);
      return false;
    }
  },

  /**
   * 状態変更イベントのリスナーを登録（ミニプレイヤーウィンドウ内で使用）
   */
  onStateChange: (callback: (state: MiniPlayerState) => void): (() => void) => {
    if (!isElectron()) {
      return () => {};
    }
    try {
      return window.electron.miniPlayer.onStateChange(callback);
    } catch (error) {
      console.error("状態変更リスナーの登録に失敗:", error);
      return () => {};
    }
  },

  /**
   * 状態再送信リクエストのリスナーを登録（メインウィンドウで使用）
   */
  onRequestState: (callback: () => void): (() => void) => {
    if (!isElectron()) {
      return () => {};
    }
    try {
      return window.electron.miniPlayer.onRequestState(callback);
    } catch (error) {
      console.error("状態再送信リスナーの登録に失敗:", error);
      return () => {};
    }
  },
};
