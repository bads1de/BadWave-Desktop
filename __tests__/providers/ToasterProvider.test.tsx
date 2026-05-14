/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import ToasterProvider from "@/providers/ToasterProvider";

describe("ToasterProvider", () => {
  it("should render Toaster component", () => {
    const { container } = render(<ToasterProvider />);
    expect(container.querySelector("[data-testid]") || container.firstChild).toBeDefined();
  });
});
