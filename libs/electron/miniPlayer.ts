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
// 共通のエラーハンドリング関数
const safeIpcInvoke = async <T>(
  fn: () => Promise<T>,
  fallbackValue: T,
  errorMessage: string,
): Promise<T> => {
  if (!isElectron()) {
    // 戻り値がオブジェクトで、かつsuccessプロパティを持つ場合（APIレスポンス型の場合）
    if (
      typeof fallbackValue === "object" &&
      fallbackValue !== null &&
      "success" in fallbackValue
    ) {
      return {
        ...fallbackValue,
        error: "Electron環境ではありません",
      };
    }
    return fallbackValue;
  }
  try {
    return await fn();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    if (
      typeof fallbackValue === "object" &&
      fallbackValue !== null &&
      "success" in fallbackValue
    ) {
      return {
        ...fallbackValue,
        error: String(error),
      };
    }
    return fallbackValue;
  }
};

export const miniPlayer = {
  /**
   * ミニプレイヤーを開く
   */
  open: () =>
    safeIpcInvoke(
      () => window.electron.miniPlayer.open(),
      { success: false },
      "ミニプレイヤーを開く際にエラー",
    ),

  /**
   * ミニプレイヤーを閉じる
   */
  close: () =>
    safeIpcInvoke(
      () => window.electron.miniPlayer.close(),
      { success: false },
      "ミニプレイヤーを閉じる際にエラー",
    ),

  /**
   * ミニプレイヤーの状態を更新
   */
  updateState: (state: MiniPlayerState) =>
    safeIpcInvoke(
      () => window.electron.miniPlayer.updateState(state),
      { success: false },
      "ミニプレイヤーの状態更新に失敗",
    ),

  /**
   * ミニプレイヤーから再生コントロール
   */
  control: (action: "play-pause" | "next" | "previous") =>
    safeIpcInvoke(
      () => window.electron.miniPlayer.control(action),
      { success: false },
      "ミニプレイヤーのコントロールに失敗",
    ),

  /**
   * ミニプレイヤーが開いているか確認
   */
  isOpen: () =>
    safeIpcInvoke(
      () => window.electron.miniPlayer.isOpen(),
      false,
      "ミニプレイヤーの状態確認に失敗",
    ),

  /**
   * ミニプレイヤーの準備完了を通知
   */
  ready: () =>
    safeIpcInvoke(
      () => window.electron.miniPlayer.ready(),
      { success: false },
      "ミニプレイヤーの準備完了通知に失敗",
    ),

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
