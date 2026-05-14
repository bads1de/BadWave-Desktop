/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import AudioSettingsButton from "@/components/player/AudioSettingsButton";

describe("AudioSettingsButton", () => {
  it("should render audio settings button", () => {
    render(<AudioSettingsButton />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
