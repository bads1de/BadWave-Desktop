import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Song } from "@/types";

// Map <-> 配列 の変換ヘルパー（JSON永続化用）
type LocalSongEntry = [string, Song];

interface PlayerStore {
  ids: string[];
  activeId?: string;
  isRepeating: boolean;
  isShuffling: boolean;
  shuffledIds: string[];
  isLoading: boolean;
  hasHydrated: boolean;
  localSongs: Map<string, Song>;
  setId: (id: string) => void;
  setIds: (ids: string[]) => void;
  setLocalSong: (song: Song) => void;
  setLocalSongs: (songs: Song[]) => void;
  getLocalSong: (id: string) => Song | undefined;
  /** 曲データ、アクティブID、IDリストを同時に設定（オフライン再生用） */
  playSongWithData: (song: Song, ids: string[]) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  reset: () => void;
  getNextSongId: () => string | undefined;
  getPreviousSongId: () => string | undefined;
  setIsLoading: (isLoading: boolean) => void;
  setHasHydrated: (state: boolean) => void;
  play: () => void;
}

/**
 * 再生リストを direction 方向に1つ進めた曲IDを返す。
 * リピート/シャッフルの挙動は従来の getNextSongId / getPreviousSongId と同一。
 *
 * @param state - プレイヤーの再生状態
 * @param direction - 1: 次へ / -1: 前へ
 * @returns 移動先の曲ID (移動できない場合は undefined)
 */
function stepSong(
  state: Pick<
    PlayerStore,
    "ids" | "activeId" | "isShuffling" | "isRepeating" | "shuffledIds"
  >,
  direction: 1 | -1,
): string | undefined {
  const { ids, activeId, isShuffling, isRepeating, shuffledIds } = state;

  if (ids.length === 0) {
    return undefined;
  }

  // リピート時は現在の曲に留まる
  if (isRepeating) {
    return activeId;
  }

  const list = isShuffling ? shuffledIds : ids;
  const currentIndex = list.findIndex((id) => id === activeId);
  if (currentIndex === -1) return undefined;

  const nextIndex = (currentIndex + direction + list.length) % list.length;
  return list[nextIndex];
}

/**
 * プレイヤーの状態を管理するカスタムフック
 *
 * @returns {Object} プレイヤーの状態と操作関数
 * @property {string[]} ids - 再生リストの曲ID
 * @property {string|undefined} activeId - 現在再生中の曲ID
 * @property {boolean} isRepeating - リピート再生中かどうか
 * @property {boolean} isShuffling - シャッフル再生中かどうか
 * @property {string[]} shuffledIds - シャッフルされた曲IDリスト
 * @property {boolean} isLoading - ローディング中かどうか
 * @property {function} setId - 現在の曲IDを設定する関数
 * @property {function} setIds - 再生リストを設定する関数
 * @property {function} toggleRepeat - リピート切り替え関数
 * @property {function} toggleShuffle - シャッフル切り替え関数
 * @property {function} reset - プレイヤーをリセットする関数
 * @property {function} getNextSongId - 次の曲IDを取得する関数
 * @property {function} getPreviousSongId - 前の曲IDを取得する関数
 * @property {function} setIsLoading - ローディング状態を設定する関数
 * @property {function} play - 再生を開始する関数
 */
const usePlayer = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ids: [],
      activeId: undefined,
      isRepeating: false,
      isShuffling: false,
      shuffledIds: [],
      isLoading: false,
      hasHydrated: false,
      localSongs: new Map<string, Song>(),
      // Supabase のIDは数値で返るため、どの経路から来ても文字列に揃える
      setId: (id: string) => set({ activeId: String(id) }),
      setIds: (ids: string[]) => set({ ids: ids.map(String) }),
      setLocalSong: (song: Song) =>
        set((state) => {
          const newLocalSongs = new Map(state.localSongs);
          const normalized = { ...song, id: String(song.id) };
          newLocalSongs.set(normalized.id, normalized);
          return { localSongs: newLocalSongs };
        }),
      setLocalSongs: (songs: Song[]) =>
        set((state) => {
          const newLocalSongs = new Map(state.localSongs);
          for (const song of songs) {
            const normalized = { ...song, id: String(song.id) };
            newLocalSongs.set(normalized.id, normalized);
          }
          return { localSongs: newLocalSongs };
        }),
      getLocalSong: (id: string) => {
        const state = get();
        return state.localSongs.get(String(id));
      },
      playSongWithData: (song: Song, ids: string[]) =>
        set((state) => {
          const normalized = { ...song, id: String(song.id) };
          const newLocalSongs = new Map(state.localSongs);
          newLocalSongs.set(normalized.id, normalized);
          return {
            localSongs: newLocalSongs,
            activeId: normalized.id,
            ids: ids.map(String),
          };
        }),
      toggleRepeat: () => set((state) => ({ isRepeating: !state.isRepeating })),
      toggleShuffle: () =>
        set((state) => {
          let newShuffledIds = [...state.ids];
          if (!state.isShuffling) {
            for (let i = newShuffledIds.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [newShuffledIds[i], newShuffledIds[j]] = [
                newShuffledIds[j],
                newShuffledIds[i],
              ];
            }
          }
          return {
            isShuffling: !state.isShuffling,
            shuffledIds: newShuffledIds,
          };
        }),
      reset: () =>
        set({
          ids: [],
          activeId: undefined,
          isRepeating: false,
          isShuffling: false,
          isLoading: false,
        }),
      getNextSongId: () => stepSong(get(), 1),
      getPreviousSongId: () => stepSong(get(), -1),
      setIsLoading: (isLoading: boolean) => set({ isLoading }),
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
      play: () => set({ isLoading: true }),
    }),
    {
      name: "badwave-player",
      // isLoading, hasHydrated は永続化から除外
      partialize: (state) => ({
        ids: state.ids,
        activeId: state.activeId,
        isRepeating: state.isRepeating,
        isShuffling: state.isShuffling,
        shuffledIds: state.shuffledIds,
        // Mapを配列に変換して永続化
        localSongs: Array.from(state.localSongs.entries()) as LocalSongEntry[],
      }),
      // 復元時に配列をMapに変換
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PlayerStore> & { localSongs?: LocalSongEntry[] };
        return {
          ...currentState,
          ...(persisted as unknown as Partial<PlayerStore>),
          localSongs: persisted?.localSongs
            ? new Map<string, Song>(persisted.localSongs as LocalSongEntry[])
            : currentState.localSongs,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default usePlayer;
