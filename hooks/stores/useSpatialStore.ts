import { createPersistedStore } from "@/hooks/utils/createPersistedStore";

interface SpatialStore {
  isSpatialEnabled: boolean;
  toggleSpatialEnabled: () => void;
}

const useSpatialStore = createPersistedStore<SpatialStore>(
  (set) => ({
    isSpatialEnabled: false,
    toggleSpatialEnabled: () =>
      set((state) => ({ isSpatialEnabled: !state.isSpatialEnabled })),
  }),
  "badwave-spatial-store",
);

export default useSpatialStore;
