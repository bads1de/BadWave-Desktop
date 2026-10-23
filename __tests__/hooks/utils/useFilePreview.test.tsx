import { act, renderHook } from "@testing-library/react";
import useFilePreview from "@/hooks/utils/useFilePreview";

describe("useFilePreview", () => {
  const createObjectURL = jest.fn();
  const revokeObjectURL = jest.fn();

  beforeEach(() => {
    createObjectURL.mockReset();
    revokeObjectURL.mockReset();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
  });

  it("ファイルを指定すると Blob URL を生成する", () => {
    const file = new File(["audio"], "song.mp3", { type: "audio/mpeg" });
    createObjectURL.mockReturnValue("blob:song");

    const { result } = renderHook(() => useFilePreview());

    act(() => {
      result.current.showPreview(file);
    });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(result.current.previewUrl).toBe("blob:song");
  });

  it("ファイルが変わると古い URL を解放して新しい URL を生成する", () => {
    const firstFile = new File(["first"], "first.mp3", { type: "audio/mpeg" });
    const secondFile = new File(["second"], "second.mp3", {
      type: "audio/mpeg",
    });
    createObjectURL
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second");

    const { result } = renderHook(() => useFilePreview());

    act(() => {
      result.current.showPreview(firstFile);
    });
    act(() => {
      result.current.showPreview(secondFile);
    });

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first");
    expect(result.current.previewUrl).toBe("blob:second");
  });

  it("clearPreview で URL を解放して null に戻す", () => {
    const file = new File(["audio"], "song.mp3", { type: "audio/mpeg" });
    createObjectURL.mockReturnValue("blob:song");

    const { result } = renderHook(() => useFilePreview());

    act(() => {
      result.current.showPreview(file);
    });
    act(() => {
      result.current.clearPreview();
    });

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:song");
    expect(result.current.previewUrl).toBeNull();
  });

  it("アンマウント時に URL を解放する", () => {
    const file = new File(["audio"], "song.mp3", { type: "audio/mpeg" });
    createObjectURL.mockReturnValue("blob:song");

    const { result, unmount } = renderHook(() => useFilePreview());

    act(() => {
      result.current.showPreview(file);
    });

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:song");
  });
});
