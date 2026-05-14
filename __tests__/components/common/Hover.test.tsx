/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import Hover from "@/components/common/Hover";

// Mock HoverCard components as they use Portal
jest.mock("@/components/ui/hover-card", () => ({
  HoverCard: ({ children }: any) => <div data-testid="hover-card">{children}</div>,
  HoverCardTrigger: ({ children }: any) => <div data-testid="hover-trigger">{children}</div>,
  HoverCardContent: ({ children }: any) => <div data-testid="hover-content">{children}</div>,
}));

jest.mock("@radix-ui/react-portal", () => ({
  Portal: ({ children }: any) => <div data-testid="portal">{children}</div>,
}));

describe("Hover", () => {
  it("should render child element", () => {
    render(
      <Hover>
        <span>Hover me</span>
      </Hover>
    );
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("should render description in content", () => {
    render(
      <Hover description="Helpful info">
        <span>Trigger</span>
      </Hover>
    );
    expect(screen.getByText("Trigger")).toBeInTheDocument();
    expect(screen.getByText("Helpful info")).toBeInTheDocument();
  });
});
