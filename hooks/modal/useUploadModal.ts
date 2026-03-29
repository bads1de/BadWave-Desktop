import { createModal } from "@/hooks/utils/createModal";

/**
 * アップロードモーダルの状態を管理するカスタムフック
 *
 * @returns {Object} アップロードモーダルの状態と操作関数
 * @property {boolean} isOpen - モーダルが開いているかどうか
 * @property {function} onOpen - モーダルを開く関数
 * @property {function} onClose - モーダルを閉じる関数
 */
export const useUploadModal = createModal();

export default useUploadModal;
