import {
  isElectron,
  getAppVersion,
  getPlatform,
  isNetworkError,
} from "./common";
import { windowControls } from "./window";
import { store } from "./store";
import { mediaControls } from "./media";
import { ipc } from "./ipc";
import { offline, OfflineSong, SongDownloadPayload } from "./offline";
import { dev } from "./dev";
import { cache } from "./cache";
import { auth } from "./auth";
import { miniPlayer, MiniPlayerSong, MiniPlayerState } from "./miniPlayer";

/**
 * Electronの機能をまとめたオブジェクト
 */
export const electronAPI = {
  isElectron,
  getAppVersion,
  getPlatform,
  windowControls,
  store,
  mediaControls,
  ipc,
  offline,
  dev,
  cache,
  auth,
  miniPlayer,
};

// 個別のエクスポートも提供
export {
  isElectron,
  getAppVersion,
  getPlatform,
  isNetworkError,
  windowControls,
  store,
  mediaControls,
  ipc,
  offline,
  dev,
  cache,
  auth,
  miniPlayer,
};

// 型のエクスポート
export type {
  OfflineSong,
  SongDownloadPayload,
  MiniPlayerSong,
  MiniPlayerState,
};
