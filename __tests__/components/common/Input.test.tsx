/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Input from "@/components/common/Input";

describe("Input", () => {
  it("should render correctly", () => {
    render(<Input placeholder="Search..." />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("should handle change events", () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("should be disabled when the disabled prop is true", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should pass extra props to the input element", () => {
    render(<Input name="test-input" data-testid="test-input" />);
    expect(screen.getByTestId("test-input")).toHaveAttribute("name", "test-input");
  });
});
