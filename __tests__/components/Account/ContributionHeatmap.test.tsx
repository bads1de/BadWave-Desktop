/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import ContributionHeatmap from "@/components/account/ContributionHeatmap";

describe("ContributionHeatmap", () => {
  it("should render heatmap", () => {
    const { container } = render(<ContributionHeatmap dailyActivity={[]} />);
    expect(screen.getByText("TEMPORAL_ENGAGEMENT")).toBeInTheDocument();
    expect(screen.getByText("[ SYSTEM_ACTIVITY_MATRIX ]")).toBeInTheDocument();
    expect(screen.getByText("SUN")).toBeInTheDocument();
  });
});
