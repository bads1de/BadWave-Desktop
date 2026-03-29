import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 再生状態を永続化するストア
 * Spotify風の「続きから再生」機能を実現
 */
interface PlaybackState {
  songId: string | null;
  position: number;
  playlist: string[];
  timestamp: number;
  hasHydrated: boolean;
  isRestoring: boolean;
}

interface PlaybackStateActions {
  savePlaybackState: (
    songId: string,
    position: number,
    playlist?: string[]
  ) => void;
  updatePosition: (position: number) => void;
  clearPlaybackState: () => void;
  setHasHydrated: (state: boolean) => void;
  setIsRestoring: (isRestoring: boolean) => void;
}

type PlaybackStateStore = PlaybackState & PlaybackStateActions;

const EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

const usePlaybackStateStore = create<PlaybackStateStore>()(
  persist(
    (set, get) => ({
      songId: null,
      position: 0,
      playlist: [],
      timestamp: 0,
      hasHydrated: false,
      isRestoring: false,

      savePlaybackState: (
        songId: string,
        position: number,
        playlist?: string[]
      ) => {
        set({
          songId,
          position,
          playlist: playlist ?? get().playlist,
          timestamp: Date.now(),
        });
      },

      updatePosition: (position: number) => {
        const { songId } = get();
        if (songId) {
          set({
            position,
            timestamp: Date.now(),
          });
        }
      },

      clearPlaybackState: () => {
        set({
          songId: null,
          position: 0,
          playlist: [],
          timestamp: 0,
        });
      },

      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),

      setIsRestoring: (isRestoring: boolean) => set({ isRestoring }),
    }),
    {
      name: "badwave-playback-state",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const isExpired = Date.now() - state.timestamp > EXPIRATION_MS;
          if (isExpired) {
            state.clearPlaybackState();
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);

export default usePlaybackStateStore;

export const POSITION_SAVE_INTERVAL_MS = 5000;
