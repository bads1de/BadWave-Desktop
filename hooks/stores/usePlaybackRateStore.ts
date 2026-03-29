import { createPersistedStore } from "@/hooks/utils/createPersistedStore";

interface PlaybackRateStore {
  rate: number;
  isSlowedReverb: boolean;
  setRate: (rate: number) => void;
  setIsSlowedReverb: (state: boolean) => void;
}

const usePlaybackRateStore = createPersistedStore<PlaybackRateStore>(
  (set) => ({
    rate: 1.0,
    isSlowedReverb: false,
    setRate: (rate) => set({ rate }),
    setIsSlowedReverb: (isSlowedReverb) => set({ isSlowedReverb }),
  }),
  "badwave-playback-rate",
);

export default usePlaybackRateStore;
