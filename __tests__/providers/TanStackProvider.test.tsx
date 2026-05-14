/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, waitFor } from "@testing-library/react";
import TanStackProvider from "@/providers/TanStackProvider";

// Mock the electron index
jest.mock("@/libs/electron/index", () => ({
  electronAPI: {
    store: {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    },
  },
  isElectron: jest.fn().mockReturnValue(false),
}));

// Mock constants
jest.mock("@/constants", () => ({
  CACHE_CONFIG: {
    staleTime: 60000,
    gcTime: 300000,
  },
}));

// Mock queryOnlineManager
jest.mock("@/libs/queryOnlineManager", () => ({
  setupOnlineManager: jest.fn(),
  setupFocusManager: jest.fn(),
  setupMutationResume: jest.fn().mockReturnValue(() => {}),
}));

describe("TanStackProvider", () => {
  it("should render children", () => {
    const { getByText } = render(
      <TanStackProvider>
        <div>Child Content</div>
      </TanStackProvider>
    );
    expect(getByText("Child Content")).toBeInTheDocument();
  });

  it("should setup online manager on mount", async () => {
    const { setupOnlineManager } = require("@/libs/queryOnlineManager");
    render(
      <TanStackProvider>
        <div>Child</div>
      </TanStackProvider>
    );
    await waitFor(() => {
      expect(setupOnlineManager).toHaveBeenCalled();
    });
  });
});
