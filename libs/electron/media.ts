import { isElectron } from "./common";

/**
 * メディア制御
 */
export const mediaControls = {
  onMediaControl: (callback: (action: string) => void): (() => void) => {
    if (isElectron()) {
      return window.electron.media.onMediaControl(callback);
    }

    return () => {};
  },
};
