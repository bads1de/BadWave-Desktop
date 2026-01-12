import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 8D Audio の回転速度オプション
 */
export type RotationSpeed = "slow" | "medium" | "fast";

/**
 * エフェクト設定の状態管理ストア
 * - 8D Audio（自動パンニング）
 * - Retro Mode
 * - Bass Boost
 */
interface EffectStore {
  // Slowed + Reverb
  isSlowedReverb: boolean;
  toggleSlowedReverb: () => void;

  // 8D Audio
  is8DAudioEnabled: boolean;
  rotationSpeed: RotationSpeed;
  toggle8DAudio: () => void;
  setRotationSpeed: (speed: RotationSpeed) => void;

  // Retro Mode
  isRetroEnabled: boolean;
  toggleRetro: () => void;

  // Bass Boost
  isBassBoostEnabled: boolean;
  toggleBassBoost: () => void;

  // ハイドレート
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

/**
 * 回転速度に対応するLFO周期（秒）
 */
export const ROTATION_SPEED_VALUES: Record<RotationSpeed, number> = {
  slow: 8, // 8秒で1周
  medium: 4, // 4秒で1周
  fast: 2, // 2秒で1周
};

const useEffectStore = create<EffectStore>()(
  persist(
    (set) => ({
      // Slowed + Reverb
      isSlowedReverb: false,
      toggleSlowedReverb: () =>
        set((state) => ({ isSlowedReverb: !state.isSlowedReverb })),

      // 8D Audio
      is8DAudioEnabled: false,
      rotationSpeed: "medium" as RotationSpeed,
      toggle8DAudio: () =>
        set((state) => ({ is8DAudioEnabled: !state.is8DAudioEnabled })),
      setRotationSpeed: (speed) => set({ rotationSpeed: speed }),

      // Retro Mode
      isRetroEnabled: false,
      toggleRetro: () =>
        set((state) => ({ isRetroEnabled: !state.isRetroEnabled })),

      // Bass Boost
      isBassBoostEnabled: false,
      toggleBassBoost: () =>
        set((state) => ({ isBassBoostEnabled: !state.isBassBoostEnabled })),

      // ハイドレート
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "badwave-effect-store",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useEffectStore;
