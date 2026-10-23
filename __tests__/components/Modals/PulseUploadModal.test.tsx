/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import PulseUploadModal from "@/components/modals/PulseUploadModal";
import usePulseUploadModal from "@/hooks/modal/usePulseUploadModal";

jest.mock("@/hooks/mutations/usePulseUploadMutation", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
  })),
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

describe("components/modals/PulseUploadModal", () => {
  const createObjectURL = jest.fn();
  const revokeObjectURL = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createObjectURL.mockReturnValue("blob:pulse");
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    usePulseUploadModal.setState({ isOpen: true });
  });

  afterEach(() => {
    act(() => {
      usePulseUploadModal.setState({ isOpen: false });
    });
  });

  it("ファイル選択時に Blob URL を1回だけ生成する", async () => {
    const { container } = render(<PulseUploadModal />);

    const input = screen.getByLabelText("音声ファイル");
    const file = new File(["audio"], "pulse.mp3", { type: "audio/mpeg" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledTimes(1);
    });
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(container.querySelector("audio")).toBeInTheDocument();
  });

  it("モーダルが閉じるとプレビュー URL を解放する", async () => {
    const { container } = render(<PulseUploadModal />);

    const input = screen.getByLabelText("音声ファイル");
    const file = new File(["audio"], "pulse.mp3", { type: "audio/mpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(container.querySelector("audio")).toBeInTheDocument();
    });

    act(() => {
      usePulseUploadModal.setState({ isOpen: false });
    });

    await waitFor(() => {
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:pulse");
    });
    expect(container.querySelector("audio")).toBeNull();
  });
});
