/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AudioWaveform from "@/components/AudioWaveform";
import useAudioWaveStore from "@/hooks/audio/useAudioWave";

// Mock the store
jest.mock("@/hooks/audio/useAudioWave");

describe("AudioWaveform", () => {
  const mockStore = {
    analyser: null,
    currentTime: 0,
    duration: 100,
    isPlaying: false,
    isEnded: false,
    play: jest.fn(),
    pause: jest.fn(),
    initializeAudio: jest.fn(),
    cleanup: jest.fn(),
    setIsEnded: jest.fn(),
  };

  const props = {
    audioUrl: "test.mp3",
    isPlaying: false,
    onPlayPause: jest.fn(),
    onEnded: jest.fn(),
    primaryColor: "#00ff87",
    secondaryColor: "#60efff",
    imageUrl: "/test.jpg",
    songId: "song-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAudioWaveStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("should initialize audio on mount", () => {
    render(<AudioWaveform {...props} />);
    expect(mockStore.initializeAudio).toHaveBeenCalledWith("test.mp3", "song-1");
  });

  it("should call play when external isPlaying prop becomes true", () => {
    const { rerender } = render(<AudioWaveform {...props} />);
    rerender(<AudioWaveform {...props} isPlaying={true} />);
    expect(mockStore.play).toHaveBeenCalled();
  });

  it("should call pause when internal isPlaying is true and clicked", () => {
    mockStore.isPlaying = true;
    const { container } = render(<AudioWaveform {...props} isPlaying={true} />);
    
    const canvasElement = container.querySelector("canvas");
    if (canvasElement) {
      fireEvent.click(canvasElement);
      expect(mockStore.pause).toHaveBeenCalled();
    }
  });

  it("should show image when isEnded is true", () => {
    mockStore.isEnded = true;
    mockStore.isPlaying = false;
    render(<AudioWaveform {...props} />);
    
    const image = screen.getByAltText("Cover");
    expect(image).toBeInTheDocument();
  });
});