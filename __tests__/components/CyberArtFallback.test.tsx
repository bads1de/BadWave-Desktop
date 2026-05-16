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
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    shadowBlur: 0,
    shadowColor: "",
    font: "",
    textAlign: "",
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
    expect(canvas).toHaveClass("w-full", "h-full", "object-cover", "opacity-80");
  });

  it("should render scanline overlay", () => {
    const { container } = render(<CyberArtFallback />);
    const overlay = container.querySelector(".pointer-events-none");
    expect(overlay).toBeInTheDocument();
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

  it("should call getByteTimeDomainData when audio data is present", () => {
    mockIsPlaying = true;
    // 周波数データに非ゼロの値を設定（hasAudioData = true にする）
    mockAnalyser.getByteFrequencyData.mockImplementation((arr: Uint8Array) => {
      arr.fill(128); // 中間値で埋める
    });
    mockAnalyser.getByteTimeDomainData.mockImplementation((arr: Uint8Array) => {
      arr.fill(128);
    });

    render(<CyberArtFallback />);

    if (rafCallback) {
      rafCallback(0);
    }

    expect(mockAnalyser.getByteTimeDomainData).toHaveBeenCalled();
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
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(800);
  });

  it("should memo the component", () => {
    expect(CyberArtFallback.displayName).toBe("CyberArtFallback");
  });
});
