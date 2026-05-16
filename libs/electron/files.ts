import { Song } from "@/types";

/**
 * ローカルファイルの存在確認
 * @param filePath - 確認するファイルの絶対パス
 * @returns ファイルが存在する場合true
 */
export async function checkLocalFileExists(filePath: string): Promise<boolean> {
  try {
    return await (window as any).electron.ipc.invoke(
      "check-local-file-exists",
      filePath
    );
  } catch {
    return false;
  }
}

/**
 * キュー内のローカル曲で、ファイルが存在しないものを除外する
 * @param ids - キューの曲ID配列
 * @param localSongs - ローカル曲のMap（ID -> Song）
 * @param fileChecker - ファイル存在確認関数（テストで差し替え可能）
 * @returns 存在するファイルのみのID配列
 */
export async function filterStaleLocalSongs(
  ids: string[],
  localSongs: Map<string, Song>,
  fileChecker: (filePath: string) => Promise<boolean> = checkLocalFileExists
): Promise<string[]> {
  const results = await Promise.all(
    ids.map(async (id) => {
      // ローカルIDでない場合はそのまま通す
      if (!id.startsWith("local_")) {
        return { id, keep: true };
      }

      // localSongs マップにデータがない場合は除外
      const song = localSongs.get(id);
      if (!song) {
        return { id, keep: false };
      }

      // ファイルの存在確認
      const exists = await fileChecker(song.song_path);
      return { id, keep: exists };
    })
  );

  return results.filter((r) => r.keep).map((r) => r.id);
}
