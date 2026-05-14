/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import Modal from "@/components/modals/Modal";

describe("Modal", () => {
  it("should render children when open", () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        Modal Content
      </Modal>
    );
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("should render title when provided", () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Title">
        Content
      </Modal>
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("should not render children when closed", () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()}>
        Hidden Content
      </Modal>
    );
    expect(screen.queryByText("Hidden Content")).not.toBeInTheDocument();
  });
});
