/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import Slider from "@/components/player/Slider";

describe("Slider", () => {
  it("should render slider element with aria-label", () => {
    render(<Slider value={0.5} onChange={jest.fn()} />);
    expect(screen.getByLabelText("Volume")).toBeInTheDocument();
  });

  it("should render with default value when no value provided", () => {
    render(<Slider onChange={jest.fn()} />);
    expect(screen.getByLabelText("Volume")).toBeInTheDocument();
  });

  it("should render vertical slider", () => {
    const { container } = render(<Slider value={1} onChange={jest.fn()} />);
    const root = container.querySelector('[class*="flex flex-col"]');
    expect(root).toBeInTheDocument();
  });
});
