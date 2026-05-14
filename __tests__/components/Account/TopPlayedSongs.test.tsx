/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import TopPlayedSongs from "@/components/account/TopPlayedSongs";

jest.mock("@/hooks/data/useGetTopPlayedSongs", () => () => ({
  topSongs: [],
  isLoading: false,
}));

jest.mock("@/hooks/player/useOnPlay", () => () => jest.fn());

describe("TopPlayedSongs", () => {
  it("should render top played songs section", () => {
    render(<TopPlayedSongs user={{ id: "user-1" }} />);
    expect(screen.getByText("再生ランキング")).toBeInTheDocument();
  });
});
