import { createPersistedStore } from "@/hooks/utils/createPersistedStore";

export type RotationSpeed = "slow" | "medium" | "fast";

/**
 * エフェクト設定の状態管理ストア
 * - 8D Audio（自動パンニング）
 * - Retro Mode
 * - Bass Boost
 */
interface EffectStore {
  isSlowedReverb: boolean;
  toggleSlowedReverb: () => void;
  is8DAudioEnabled: boolean;
  rotationSpeed: RotationSpeed;
  toggle8DAudio: () => void;
  setRotationSpeed: (speed: RotationSpeed) => void;
  isRetroEnabled: boolean;
  toggleRetro: () => void;
  isBassBoostEnabled: boolean;
  toggleBassBoost: () => void;
}

export const ROTATION_SPEED_VALUES: Record<RotationSpeed, number> = {
  slow: 8,
  medium: 4,
  fast: 2,
};

const useEffectStore = createPersistedStore<EffectStore>(
  (set) => ({
    isSlowedReverb: false,
    toggleSlowedReverb: () =>
      set((state) => ({ isSlowedReverb: !state.isSlowedReverb })),

    is8DAudioEnabled: false,
    rotationSpeed: "medium" as RotationSpeed,
    toggle8DAudio: () =>
      set((state) => ({ is8DAudioEnabled: !state.is8DAudioEnabled })),
    setRotationSpeed: (speed) => set({ rotationSpeed: speed }),

    isRetroEnabled: false,
    toggleRetro: () =>
      set((state) => ({ isRetroEnabled: !state.isRetroEnabled })),

    isBassBoostEnabled: false,
    toggleBassBoost: () =>
      set((state) => ({ isBassBoostEnabled: !state.isBassBoostEnabled })),
  }),
  "badwave-effect-store",
);

export default useEffectStore;
