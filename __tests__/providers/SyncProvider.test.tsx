/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import { SyncProvider } from "@/providers/SyncProvider";
import { useBackgroundSync } from "@/hooks/utils/useBackgroundSync";

// Mock hooks
jest.mock("@/hooks/utils/useBackgroundSync");

describe("SyncProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call useBackgroundSync hook", () => {
    render(
      <SyncProvider>
        <div data-testid="child">Child</div>
      </SyncProvider>
    );

    expect(useBackgroundSync).toHaveBeenCalled();
  });

  it("should render children", () => {
    const { getByTestId } = render(
      <SyncProvider>
        <div data-testid="child">Child</div>
      </SyncProvider>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });
});
