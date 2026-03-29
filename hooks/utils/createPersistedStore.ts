import { create, StoreApi, UseBoundStore } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";

type PersistHydrated = {
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
};

/**
 * hasHydrated 管理を自動化する persisted ストアファクトリー
 *
 * persist ミドルウェアを使用するストアで毎回同じ hasHydrated / setHasHydrated /
 * onRehydrateStorage のボイラープレートを書く必要がなくなる。
 *
 * @example
 * const useVolumeStore = createPersistedStore(
 *   (set) => ({
 *     volume: 0.5,
 *     setVolume: (v: number) => set({ volume: Math.max(0, Math.min(1, v)) }),
 *   }),
 *   "badwave-volume",
 * );
 */
export function createPersistedStore<S extends object>(
  initializer: (set: StoreApi<S & PersistHydrated>["setState"], get: () => S & PersistHydrated) => S,
  name: string,
  options?: {
    onRehydrateStorage?: () => (state: (S & PersistHydrated) | undefined) => void;
    [key: string]: unknown;
  },
): UseBoundStore<StoreApi<S & PersistHydrated>> {
  return create<S & PersistHydrated>()(
    persist(
      (set, get) => ({
        ...initializer(set, get as () => S & PersistHydrated),
        hasHydrated: false,
        setHasHydrated: (state: boolean) => set({ hasHydrated: state } as any),
      }),
      {
        name,
        onRehydrateStorage: () => (state) => {
          if (options?.onRehydrateStorage) {
            const customCb = options.onRehydrateStorage();
            customCb(state);
          }
          state?.setHasHydrated(true);
        },
      },
    ),
  );
}
