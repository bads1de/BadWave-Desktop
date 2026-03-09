/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SpotlightModal from "@/components/Modals/SpotlightModal";
import useSpotlightModal from "@/hooks/modal/useSpotlightModal";
import useVolumeStore from "@/hooks/stores/useVolumeStore";

// Mock hooks
jest.mock("@/hooks/modal/useSpotlightModal");
jest.mock("@/hooks/stores/useVolumeStore");

// Mock Dialog component
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
}));

describe("SpotlightModal", () => {
  const mockItem = {
    id: "spotlight-1",
    title: "Test Video",
    description: "Test Description",
    video_path: "test-video.mp4",
    author: "Test Author",
    genre: "Ambient",
  };

  const mockOnClose = jest.fn();

  const setupMocks = (isOpen = true, selectedItem: any = mockItem) => {
    (useSpotlightModal as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        isOpen,
        selectedItem,
        onClose: mockOnClose,
      };
      return selector ? selector(state) : state;
    });
    (useVolumeStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = { volume: 0.5 };
      return selector ? selector(state) : state;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
    
    // Mock HTMLMediaElement prototype
    window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = jest.fn();
  });

  it("should render spotlight item details when open", () => {
    render(<SpotlightModal />);
    
    expect(screen.getByText(mockItem.title)).toBeInTheDocument();
    expect(screen.getByText(mockItem.author)).toBeInTheDocument();
    expect(screen.getByText(mockItem.description)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockItem.genre))).toBeInTheDocument();
  });

  it("should display the video elements", () => {
    render(<SpotlightModal />);
    const videos = document.querySelectorAll("video");
    expect(videos.length).toBeGreaterThan(0);
    expect(Array.from(videos).some(v => v.src.includes(mockItem.video_path))).toBe(true);
  });

  it("should call onClose when close button is clicked", () => {
    render(<SpotlightModal />);
    const closeButton = screen.getByLabelText("Close spotlight");
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should not render anything when no selectedItem is present", () => {
    setupMocks(false, null);
    
    const { container } = render(<SpotlightModal />);
    expect(container.firstChild).toBeNull();
  });
});
