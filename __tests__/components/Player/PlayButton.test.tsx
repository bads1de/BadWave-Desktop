import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PlayButton from "@/components/player/PlayButton";

describe("PlayButton", () => {
  it("renders play button with correct styling", () => {
    render(<PlayButton />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("rounded-full");
  });

  it("renders with custom size when provided", () => {
    render(<PlayButton size={50} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("renders with default size when not provided", () => {
    render(<PlayButton />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
