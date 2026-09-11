import { invokeOr } from "./common";
import type { OfflineSong, SongDownloadPayload } from "@/types/local";

export type { OfflineSong, SongDownloadPayload };

const NOT_IN_ELECTRON = "Not in Electron environment";

/** オフライン機能（ダウンロード管理など） */
export const offline = {
  getSongs: (): Promise<OfflineSong[]> =>
    invokeOr([], () => window.electron.offline.getSongs()),

  checkStatus: (
    songId: string
  ): Promise<{
    isDownloaded: boolean;
    localPath?: string;
    localImagePath?: string;
  }> =>
    invokeOr({ isDownloaded: false }, () =>
      window.electron.offline.checkStatus(songId)
    ),

  deleteSong: (
    songId: string
  ): Promise<{ success: boolean; error?: string }> =>
    invokeOr({ success: false, error: NOT_IN_ELECTRON }, () =>
      window.electron.offline.deleteSong(songId)
    ),

  downloadSong: (
    song: SongDownloadPayload
  ): Promise<{ success: boolean; localPath?: string; error?: string }> =>
    invokeOr({ success: false, error: NOT_IN_ELECTRON }, () =>
      window.electron.offline.downloadSong(song)
    ),
};
