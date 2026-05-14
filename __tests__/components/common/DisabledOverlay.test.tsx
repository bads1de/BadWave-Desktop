/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import DisabledOverlay from "@/components/common/DisabledOverlay";

describe("DisabledOverlay", () => {
  it("should render children when not disabled", () => {
    render(<DisabledOverlay><span>Child</span></DisabledOverlay>);
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("should render children with grayscale overlay when disabled", () => {
    render(<DisabledOverlay disabled={true}><span>Disabled Child</span></DisabledOverlay>);
    expect(screen.getByText("Disabled Child")).toBeInTheDocument();
    // The child should have opacity/grayscale classes applied
    const parentDiv = screen.getByText("Disabled Child").closest(".opacity-40");
    expect(parentDiv).toBeInTheDocument();
  });

  it("should render children as-is when disabled is false", () => {
    render(<DisabledOverlay disabled={false}><span>Active Child</span></DisabledOverlay>);
    expect(screen.getByText("Active Child")).toBeInTheDocument();
  });
});
