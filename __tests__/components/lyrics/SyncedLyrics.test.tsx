/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import SyncedLyrics from "@/components/lyrics/SyncedLyrics";

describe("SyncedLyrics", () => {
  it("should render with lyrics content", () => {
    render(<SyncedLyrics lyrics="[00:01.00]Test line 1\n[00:05.00]Test line 2" />);
    expect(screen.getByText(/test line 1/i)).toBeInTheDocument();
    expect(screen.getByText(/test line 2/i)).toBeInTheDocument();
  });

  it("should handle empty lyrics", () => {
    const { container } = render(<SyncedLyrics lyrics="" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
