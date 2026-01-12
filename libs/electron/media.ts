import { isElectron } from "./common";

/**
 * メディア制御
 */
export const mediaControls = {
  onMediaControl: (callback: (action: string) => void): (() => void) => {
    if (isElectron()) {
      return (window as any).electron.media.onMediaControl(callback);
    }

    return () => {};
  },
};
