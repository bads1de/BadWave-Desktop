/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SpotlightUploadModal from "@/components/modals/SpotlightUploadModal";
import useSpotLightUploadModal from "@/hooks/modal/useSpotLightUpload";

jest.mock("@/hooks/mutations/useSpotlightUploadMutation", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
  })),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock("@/components/modals/Modal", () => ({
  __esModule: true,
  default: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
  }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    return isOpen ? React.createElement("div", null, children) : null;
  },
}));

describe("components/modals/SpotlightUploadModal", () => {
  const createObjectURL = jest.fn();
  const revokeObjectURL = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createObjectURL.mockReturnValue("blob:spotlight");
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    useSpotLightUploadModal.setState({ isOpen: true });
  });

  afterEach(() => {
    act(() => {
      useSpotLightUploadModal.setState({ isOpen: false });
    });
  });

  it("動画選択時に Blob URL を1回だけ生成する", async () => {
    const { container } = render(<SpotlightUploadModal />);

    const input = screen.getByLabelText("動画ファイル");
    const file = new File(["video"], "clip.mp4", { type: "video/mp4" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledTimes(1);
    });
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(container.querySelector("video")).toBeInTheDocument();
  });

  it("モーダルが閉じるとプレビュー URL を解放する", async () => {
    const { container } = render(<SpotlightUploadModal />);

    const input = screen.getByLabelText("動画ファイル");
    const file = new File(["video"], "clip.mp4", { type: "video/mp4" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(container.querySelector("video")).toBeInTheDocument();
    });

    act(() => {
      useSpotLightUploadModal.setState({ isOpen: false });
    });

    await waitFor(() => {
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:spotlight");
    });
    expect(container.querySelector("video")).toBeNull();
  });
});
