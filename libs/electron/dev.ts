import { invokeOr } from "./common";

// 開発用ユーティリティ
export const dev = {
  /** オフラインシミュレーションを切り替え（開発時のオフライン機能テスト用） */
  toggleOfflineSimulation: (): Promise<{ isOffline: boolean }> =>
    invokeOr({ isOffline: false }, () =>
      window.electron.dev.toggleOfflineSimulation()
    ),

  /** 現在のオフラインシミュレーション状態を取得 */
  getOfflineSimulationStatus: (): Promise<{ isOffline: boolean }> =>
    invokeOr({ isOffline: false }, () =>
      window.electron.dev.getOfflineSimulationStatus()
    ),

  /** オフラインシミュレーションを明示的に ON/OFF */
  setOfflineSimulation: (
    offline: boolean
  ): Promise<{ isOffline: boolean }> =>
    invokeOr({ isOffline: false }, () =>
      window.electron.dev.setOfflineSimulation(offline)
    ),
};
