/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import CyberArtFallback from "@/components/common/CyberArtFallback";

// useMainAnalyser のモック
const mockAnalyser = {
  fftSize: 256,
  frequencyBinCount: 128,
  smoothingTimeConstant: 0.8,
  getByteFrequencyData: jest.fn(),
  getByteTimeDomainData: jest.fn(),
};

let mockIsPlaying = false;

jest.mock("@/hooks/audio/useMainAnalyser", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    analyser: mockAnalyser,
    isPlaying: mockIsPlaying,
  })),
}));

// requestAnimationFrame のモック
let rafCallback: FrameRequestCallback | null = null;
const mockRaf = jest.fn((cb: FrameRequestCallback) => {
  rafCallback = cb;
  return 1;
});
const mockCancelRaf = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockIsPlaying = false;
  rafCallback = null;

  global.requestAnimationFrame = mockRaf;
  global.cancelAnimationFrame = mockCancelRaf;

  // Canvas のモック
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    shadowBlur: 0,
    shadowColor: "",
    globalCompositeOperation: "source-over",
    font: "",
    textAlign: "",
    quadraticCurveTo: jest.fn(),
    fillText: jest.fn(),
  })) as any;
});

describe("CyberArtFallback", () => {
  it("should render canvas element", () => {
    const { container } = render(<CyberArtFallback />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("should have correct canvas classes", () => {
    const { container } = render(<CyberArtFallback />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveClass("w-full", "h-full", "object-cover", "transition-opacity", "duration-1000");
  });

  it("should render canvas with decorative overlay divs", () => {
    const { container } = render(<CyberArtFallback />);
    const root = container.querySelector("[data-testid='cyber-art-fallback']");
    const canvases = container.querySelectorAll("canvas");
    // Should have exactly one canvas
    expect(canvases.length).toBe(1);

    expect(root).toHaveClass("pointer-events-none", "isolate");
    // Root should have exactly 4 children: canvas + 3 decorative overlays
    expect(root?.children.length).toBe(4);
    // First child is the canvas
    expect(root?.children[0].tagName).toBe("CANVAS");
  });

  it("should request animation frame on mount", () => {
    render(<CyberArtFallback />);
    expect(mockRaf).toHaveBeenCalled();
  });

  it("should cancel animation frame on unmount", () => {
    const { unmount } = render(<CyberArtFallback />);
    unmount();
    expect(mockCancelRaf).toHaveBeenCalled();
  });

  it("should start animation loop", () => {
    render(<CyberArtFallback />);
    expect(rafCallback).not.toBeNull();
  });

  it("should call getByteFrequencyData when playing", () => {
    mockIsPlaying = true;
    render(<CyberArtFallback />);

    // 1フレーム実行
    if (rafCallback) {
      rafCallback(0);
    }

    expect(mockAnalyser.getByteFrequencyData).toHaveBeenCalled();
  });

  it("should not call getByteFrequencyData when not playing", () => {
    mockIsPlaying = false;
    render(<CyberArtFallback />);

    if (rafCallback) {
      rafCallback(0);
    }

    expect(mockAnalyser.getByteFrequencyData).not.toHaveBeenCalled();
  });

  it("should handle null analyser gracefully", () => {
    const useMainAnalyser = require("@/hooks/audio/useMainAnalyser").default;
    useMainAnalyser.mockReturnValue({
      analyser: null,
      isPlaying: false,
    });

    expect(() => {
      render(<CyberArtFallback />);
    }).not.toThrow();
  });

  it("should set canvas dimensions", () => {
    const { container } = render(<CyberArtFallback />);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(800);
  });

  it("should memo the component", () => {
    expect(CyberArtFallback.displayName).toBe("CyberArtFallback");
  });
});
