/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import FrequencyCurve from "@/components/equalizer/FrequencyCurve";

describe("FrequencyCurve", () => {
  it("should render SVG curve", () => {
    const { container } = render(
      <FrequencyCurve
        bands={[
          { freq: 60, gain: 0 },
          { freq: 150, gain: 0 },
          { freq: 400, gain: 0 },
          { freq: 1000, gain: 0 },
          { freq: 2400, gain: 0 },
          { freq: 15000, gain: 0 },
        ]}
        isEnabled={true}
      />
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
