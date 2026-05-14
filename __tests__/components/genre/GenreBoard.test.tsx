/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import GenreBoard from "@/components/genre/GenreBoard";

describe("GenreBoard", () => {
  it("should render genre cards", () => {
    render(<GenreBoard />);
    expect(screen.getByText("Retro Wave")).toBeInTheDocument();
    expect(screen.getByText("Electro House")).toBeInTheDocument();
    expect(screen.getByText("City Pop")).toBeInTheDocument();
  });
});
