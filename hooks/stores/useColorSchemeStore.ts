import { createPersistedStore } from "@/hooks/utils/createPersistedStore";
import {
  DEFAULT_COLOR_SCHEME_ID,
  getColorSchemeById,
  type ColorScheme,
} from "@/constants/colorSchemes";

interface ColorSchemeStore {
  colorSchemeId: string;
  getColorScheme: () => ColorScheme;
  setColorScheme: (id: string) => void;
}

const useColorSchemeStore = createPersistedStore<ColorSchemeStore>(
  (set, get) => ({
    colorSchemeId: DEFAULT_COLOR_SCHEME_ID,
    getColorScheme: () => getColorSchemeById(get().colorSchemeId),
    setColorScheme: (id: string) => set({ colorSchemeId: id }),
  }),
  "badwave-color-scheme",
);

export default useColorSchemeStore;
