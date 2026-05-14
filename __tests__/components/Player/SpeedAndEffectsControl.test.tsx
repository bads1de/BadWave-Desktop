/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import SpeedAndEffectsControl from "@/components/player/SpeedAndEffectsControl";

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

describe("SpeedAndEffectsControl", () => {
  it("should render speed control with current rate", () => {
    render(<SpeedAndEffectsControl />);
    expect(screen.getByText("1.00x")).toBeInTheDocument();
  });

  it("should render preset speed buttons", () => {
    render(<SpeedAndEffectsControl />);
    expect(screen.getByText("0.9x")).toBeInTheDocument();
    expect(screen.getByText("1x")).toBeInTheDocument();
    expect(screen.getByText("1.25x")).toBeInTheDocument();
  });

  it("should render effect module labels", () => {
    render(<SpeedAndEffectsControl />);
    expect(screen.getByText(/SLOWED_REVERB/)).toBeInTheDocument();
    expect(screen.getByText(/SPATIAL_SYNC/)).toBeInTheDocument();
    expect(screen.getByText(/8D_ROTATION/)).toBeInTheDocument();
  });
});
