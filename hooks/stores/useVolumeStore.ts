import { createPersistedStore } from "@/hooks/utils/createPersistedStore";

const DEFAULT_VOLUME = 0.5;

interface VolumeStore {
  volume: number;
  setVolume: (volume: number) => void;
}

const useVolumeStore = createPersistedStore<VolumeStore>(
  (set) => ({
    volume: DEFAULT_VOLUME,
    setVolume: (volume: number) =>
      set({ volume: Math.max(0, Math.min(1, volume)) }),
  }),
  "badwave-volume",
);

export default useVolumeStore;
