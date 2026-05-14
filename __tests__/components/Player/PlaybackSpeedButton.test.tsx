/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import PlaybackSpeedButton from "@/components/player/PlaybackSpeedButton";

jest.mock("@/hooks/stores/usePlaybackRateStore", () => (selector?: any) => {
  const state = { rate: 1, setRate: jest.fn() };
  return selector ? selector(state) : state;
});

jest.mock("@/hooks/stores/useSpatialStore", () => () => ({
  isSpatialEnabled: false,
  toggleSpatialEnabled: jest.fn(),
}));

jest.mock("@/hooks/stores/useEffectStore", () => (selector?: any) => {
  const state = {
    is8DAudioEnabled: false,
    toggle8DAudio: jest.fn(),
    rotationSpeed: "medium",
    setRotationSpeed: jest.fn(),
    isRetroEnabled: false,
    toggleRetro: jest.fn(),
    isBassBoostEnabled: false,
    toggleBassBoost: jest.fn(),
    isSlowedReverb: false,
    toggleSlowedReverb: jest.fn(),
  };
  return selector ? selector(state) : state;
});

// Mock Popover components
jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: any) => <div data-testid="popover">{children}</div>,
  PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>,
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
}));

describe("PlaybackSpeedButton", () => {
  it("should render speed button with current rate", () => {
    render(<PlaybackSpeedButton />);
    const speedTexts = screen.getAllByText("1x");
    expect(speedTexts.length).toBeGreaterThanOrEqual(1);
  });
});
