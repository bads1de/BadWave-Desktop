import { act } from "@testing-library/react";
import usePlaylistModal from "@/hooks/modal/usePlaylistModal";
import useUploadModal from "@/hooks/modal/useUploadModal";
import useSpotlightModal from "@/hooks/modal/useSpotlightModal";
// 他のモーダルフックも必要に応じてインポート

// 汎用的なテスト関数
const testModalHook = (hook: any, name: string) => {
  describe(`${name}`, () => {
    beforeEach(() => {
      act(() => {
        hook.setState({ isOpen: false });
      });
    });

    it("should default to closed", () => {
      expect(hook.getState().isOpen).toBe(false);
    });

    it("should open", () => {
      act(() => {
        hook.getState().onOpen();
      });
      expect(hook.getState().isOpen).toBe(true);
    });

    it("should close", () => {
      act(() => {
        hook.getState().onOpen();
        hook.getState().onClose();
      });
      expect(hook.getState().isOpen).toBe(false);
    });
  });
};

describe("Modal Hooks", () => {
  testModalHook(usePlaylistModal, "usePlaylistModal");
  testModalHook(useUploadModal, "useUploadModal");
  testModalHook(useSpotlightModal, "useSpotlightModal");
});
