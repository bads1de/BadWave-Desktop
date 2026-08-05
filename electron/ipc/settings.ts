import { CHANNELS } from "../channels";
import { ipcMain, session } from "electron";
import { z } from "zod";
import store from "../lib/store";
import { debugLog } from "../utils";
import {
  validateInput,
  storeKeySchema,
  storeValueSchema,
} from "../lib/ipc-validate";

const booleanSchema = z.boolean();

// オフラインシミュレーション状態を追跡（外部からアクセス可能）
let isSimulatingOffline = false;

export function getIsSimulatingOffline() {
  return isSimulatingOffline;
}

export function setIsSimulatingOffline(value: boolean) {
  isSimulatingOffline = value;
}

export function setupSettingsHandlers() {
  // アプリケーション設定の取得
  ipcMain.handle(CHANNELS.GET_STORE_VALUE, (_, rawKey: string) => {
    // キーインジェクション対策: 許可された文字種のみ
    const key = validateInput(storeKeySchema, rawKey, CHANNELS.GET_STORE_VALUE);
    return store.get(key);
  });

  // アプリケーション設定の保存
  ipcMain.handle(
    CHANNELS.SET_STORE_VALUE,
    (_, rawKey: string, rawValue: unknown) => {
      const key = validateInput(storeKeySchema, rawKey, "set-store-value:key");
      const value = validateInput(storeValueSchema, rawValue, "set-store-value:value");
      store.set(key, value);
      return true;
    },
  );

  // オフラインモードのシミュレーションを切り替え（開発用）
  ipcMain.handle(CHANNELS.TOGGLE_OFFLINE_SIMULATION, async () => {
    isSimulatingOffline = !isSimulatingOffline;

    session.defaultSession.enableNetworkEmulation({
      offline: isSimulatingOffline,
    });

    debugLog(
      `[Debug] Offline simulation: ${isSimulatingOffline ? "ON" : "OFF"}`,
    );
    return { isOffline: isSimulatingOffline };
  });

  // 現在のオフラインシミュレーション状態を取得
  ipcMain.handle(CHANNELS.GET_OFFLINE_SIMULATION_STATUS, () => {
    return { isOffline: isSimulatingOffline };
  });

  // オフラインシミュレーションを設定（明示的に ON/OFF）
  ipcMain.handle(CHANNELS.SET_OFFLINE_SIMULATION, async (_, rawOffline: unknown) => {
    const offline = validateInput(booleanSchema, rawOffline, CHANNELS.SET_OFFLINE_SIMULATION);
    isSimulatingOffline = offline;

    session.defaultSession.enableNetworkEmulation({
      offline: isSimulatingOffline,
    });

    debugLog(
      `[Debug] Offline simulation set to: ${isSimulatingOffline ? "ON" : "OFF"}`,
    );
    return { isOffline: isSimulatingOffline };
  });
}
