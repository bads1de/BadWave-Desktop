/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import { HiHome } from "react-icons/hi";

// Mock Hover component to avoid TooltipProvider issues in tests
jest.mock("@/components/common/Hover", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("SidebarItem", () => {
  const props = {
    icon: HiHome,
    label: "Home",
    href: "/",
    active: false,
  };

  it("should render correctly when not collapsed", () => {
    render(<SidebarItem {...props} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
  });

  it("should apply active styles when active", () => {
    render(<SidebarItem {...props} active={true} />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("bg-theme-500/20");
  });

  it("should render only icon when collapsed", () => {
    render(<SidebarItem {...props} isCollapsed={true} />);
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toBeInTheDocument();
  });
});