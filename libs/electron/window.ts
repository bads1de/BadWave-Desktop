import { isElectron } from "./common";

/**
 * ウィンドウ操作
 */
export const windowControls = {
  minimize: (): Promise<void> => {
    if (isElectron()) {
      return window.electron.window.minimize();
    }

    return Promise.resolve();
  },

  maximize: (): Promise<void> => {
    if (isElectron()) {
      return window.electron.window.maximize();
    }

    return Promise.resolve();
  },

  close: (): Promise<void> => {
    if (isElectron()) {
      return window.electron.window.close();
    }

    return Promise.resolve();
  },
};
