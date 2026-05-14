/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import { SyncSection } from "@/components/account/SyncSection";

jest.mock("@/hooks/sync/useSyncHomeAll", () => ({
  useSyncHomeAll: () => ({ sync: jest.fn(), isSyncing: false }),
}));

jest.mock("@/hooks/sync/useSyncLikedSongs", () => ({
  useSyncLikedSongs: () => ({ sync: jest.fn(), isSyncing: false }),
}));

jest.mock("@/hooks/sync/useSyncPlaylists", () => ({
  useSyncPlaylists: () => ({ sync: jest.fn(), isSyncing: false }),
}));

jest.mock("@/libs/electron", () => ({
  isElectron: () => true,
}));

describe("SyncSection", () => {
  it("should render sync section", () => {
    const { container } = render(<SyncSection />);
    expect(container).toBeInTheDocument();
  });
});
