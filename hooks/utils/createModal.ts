import { create, StoreApi, UseBoundStore } from "zustand";

export interface ModalState {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * { isOpen, onOpen, onClose } を持つシンプルなモーダルストアを生成するファクトリー
 *
 * @example
 * const useUploadModal = createModal();
 * const usePlaylistModal = createModal();
 */
export function createModal(): UseBoundStore<StoreApi<ModalState>> {
  return create<ModalState>((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
  }));
}
