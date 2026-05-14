/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import LocalFileTable from "@/components/local/LocalFileTable";

// Mock the data table
jest.mock("@/components/ui/data-table", () => ({
  DataTable: ({ columns, data }: any) => <div data-testid="data-table">{data.length} items</div>,
}));

describe("LocalFileTable", () => {
  const mockFiles = [
    { id: "1", path: "/music/song1.mp3", metadata: { common: { title: "Song 1" } } },
    { id: "2", path: "/music/song2.mp3", metadata: { common: { title: "Song 2" } } },
  ];

  it("should render local files table", () => {
    render(<LocalFileTable mp3Files={mockFiles as any} onPlayFile={jest.fn()} />);
    expect(screen.getByTestId("data-table")).toBeInTheDocument();
  });

  it("should render empty state when no files", () => {
    const { container } = render(<LocalFileTable mp3Files={[]} onPlayFile={jest.fn()} />);
    expect(container).toBeInTheDocument();
  });
});
