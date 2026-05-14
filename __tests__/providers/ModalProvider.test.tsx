/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import ModalProvider from "@/providers/ModalProvider";

// Mock all modal components
jest.mock("@/components/modals/AuthModal", () => () => <div data-testid="auth-modal" />);
jest.mock("@/components/modals/PlaylistModal", () => () => <div data-testid="playlist-modal" />);
jest.mock("@/components/modals/SpotlightModal", () => () => <div data-testid="spotlight-modal" />);
jest.mock("@/components/modals/UploadModal", () => () => <div data-testid="upload-modal" />);
jest.mock("@/components/modals/SpotlightUploadModal", () => () => <div data-testid="spotlight-upload-modal" />);
jest.mock("@/components/modals/PulseUploadModal", () => () => <div data-testid="pulse-upload-modal" />);

describe("ModalProvider", () => {
  it("should render all modals after mounting", () => {
    jest.useFakeTimers();
    const { getByTestId } = render(<ModalProvider />);
    jest.runAllTimers();
    
    expect(getByTestId("auth-modal")).toBeInTheDocument();
    expect(getByTestId("upload-modal")).toBeInTheDocument();
    expect(getByTestId("playlist-modal")).toBeInTheDocument();
    expect(getByTestId("spotlight-modal")).toBeInTheDocument();
    expect(getByTestId("spotlight-upload-modal")).toBeInTheDocument();
    expect(getByTestId("pulse-upload-modal")).toBeInTheDocument();
    jest.useRealTimers();
  });
});
