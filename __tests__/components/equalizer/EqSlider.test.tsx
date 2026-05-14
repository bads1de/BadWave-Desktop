/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import EqSlider from "@/components/equalizer/EqSlider";

describe("EqSlider", () => {
  it("should render slider with label", () => {
    render(<EqSlider label="60Hz" value={0} onChange={jest.fn()} />);
    // The label renders in a span at the bottom
    expect(screen.getByText("60Hz")).toBeInTheDocument();
  });

  it("should display value with sign prefix", () => {
    render(<EqSlider label="1kHz" value={5} onChange={jest.fn()} />);
    // Positive values show with + prefix
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("should display negative values with minus sign", () => {
    render(<EqSlider label="1kHz" value={-3} onChange={jest.fn()} />);
    expect(screen.getByText("-3")).toBeInTheDocument();
  });
});
