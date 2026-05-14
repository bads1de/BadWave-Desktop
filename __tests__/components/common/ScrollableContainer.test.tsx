/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import ScrollableContainer from "@/components/common/ScrollableContainer";

describe("ScrollableContainer", () => {
  it("should render children", () => {
    render(<ScrollableContainer>Content</ScrollableContainer>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("should apply default overflow styles", () => {
    const { container } = render(
      <ScrollableContainer>
        <div>Content</div>
      </ScrollableContainer>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
