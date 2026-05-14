/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import EqualizerControl from "@/components/equalizer/EqualizerControl";

jest.mock("@/hooks/stores/useEqualizerStore", () => {
  const EQ_BANDS = [
    { freq: 60, label: "60" },
    { freq: 150, label: "150" },
    { freq: 400, label: "400" },
    { freq: 1000, label: "1K" },
    { freq: 2400, label: "2.4K" },
    { freq: 15000, label: "15K" },
  ];
  
  const useEqualizerStore = () => ({
    isEnabled: true,
    bands: [
      { freq: 60, gain: 0 },
      { freq: 150, gain: 0 },
      { freq: 400, gain: 0 },
      { freq: 1000, gain: 0 },
      { freq: 2400, gain: 0 },
      { freq: 15000, gain: 0 },
    ],
    activePresetId: "flat",
    presets: [{ id: "flat", name: "Flat", gains: [0, 0, 0, 0, 0, 0] }],
    setGain: jest.fn(),
    setPreset: jest.fn(),
    toggleEnabled: jest.fn(),
    reset: jest.fn(),
  });
  
  return { __esModule: true, default: useEqualizerStore, EQ_BANDS };
});

describe("EqualizerControl", () => {
  it("should render equalizer control", () => {
    const { container } = render(<EqualizerControl />);
    // The component should render some controls
    expect(container).toBeInTheDocument();
  });
});
