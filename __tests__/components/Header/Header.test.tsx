/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "@/components/header/Header";

describe("Header", () => {
  it("should render children", () => {
    render(<Header><div data-testid="child">Content</div></Header>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText(/SECTOR_ACCESS/i)).toBeInTheDocument();
  });
});
