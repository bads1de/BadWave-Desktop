/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import MiniPlayerButton from "@/components/player/MiniPlayerButton";

describe("MiniPlayerButton", () => {
  it("should render mini player button", () => {
    render(<MiniPlayerButton />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
