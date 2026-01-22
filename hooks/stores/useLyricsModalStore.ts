import { create } from "zustand";

interface LyricsModalStore {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const useLyricsModalStore = create<LyricsModalStore>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));

export default useLyricsModalStore;
