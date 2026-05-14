/**
 * @jest-environment jsdom
 */
import { mediaControls } from "@/libs/electron/media";
import { isElectron } from "@/libs/electron/common";

jest.mock("@/libs/electron/common");

describe("electron/media", () => {
  const mockOnMediaControl = jest.fn().mockReturnValue(jest.fn());

  beforeEach(() => {
    jest.clearAllMocks();
    (isElectron as jest.Mock).mockReturnValue(false);
    (window as any).electron = {
      media: {
        onMediaControl: mockOnMediaControl,
      },
    };
  });

  describe("onMediaControl", () => {
    it("should register callback when in Electron", () => {
      (isElectron as jest.Mock).mockReturnValue(true);
      const callback = jest.fn();

      mediaControls.onMediaControl(callback);
      expect(mockOnMediaControl).toHaveBeenCalledWith(callback);
    });

    it("should return noop unsubscribe when not in Electron", () => {
      const callback = jest.fn();
      const unsubscribe = mediaControls.onMediaControl(callback);
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe("function");
      expect(mockOnMediaControl).not.toHaveBeenCalled();
    });
  });
});
