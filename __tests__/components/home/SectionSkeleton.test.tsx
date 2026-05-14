/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import SectionSkeleton from "@/components/home/SectionSkeleton";

describe("SectionSkeleton", () => {
  it("should render skeleton elements", () => {
    const { container } = render(<SectionSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
