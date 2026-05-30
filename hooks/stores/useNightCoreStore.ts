import { createPersistedStore } from "@/hooks/utils/createPersistedStore";

interface NightCoreStore {
  /** NightCoreモードが有効かどうか */
  isEnabled: boolean;
  /** NightCoreモードをON/OFFする */
  toggle: () => void;
  /** NightCoreモードを設定する */
  setEnabled: (enabled: boolean) => void;
}

const useNightCoreStore = createPersistedStore<NightCoreStore>(
  (set) => ({
    isEnabled: false,
    toggle: () => set((state) => ({ isEnabled: !state.isEnabled })),
    setEnabled: (enabled) => set({ isEnabled: enabled }),
  }),
  "badwave-nightcore",
);

export default useNightCoreStore;
