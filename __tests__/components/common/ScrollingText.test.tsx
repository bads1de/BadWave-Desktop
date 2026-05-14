/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import ScrollingText from "@/components/common/ScrollingText";

describe("ScrollingText", () => {
  it("should render text content", () => {
    render(<ScrollingText text="Hello World" />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });
});
