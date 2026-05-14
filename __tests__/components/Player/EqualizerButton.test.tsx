/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import EqualizerButton from "@/components/player/EqualizerButton";

describe("EqualizerButton", () => {
  it("should render equalizer button", () => {
    render(<EqualizerButton />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
