/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import SongItemSkeleton from "@/components/song/SongItemSkeleton";

describe("SongItemSkeleton", () => {
  it("should render skeleton placeholder", () => {
    const { container } = render(<SongItemSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
