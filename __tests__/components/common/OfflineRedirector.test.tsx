/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import OfflineRedirector from "@/components/common/OfflineRedirector";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/",
}));

describe("OfflineRedirector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isOnline: true,
      isInitialized: true,
    });
  });

  it("should render nothing (redirect logic is commented out)", () => {
    const { container } = render(<OfflineRedirector />);
    expect(container.firstChild).toBeNull();
  });

  it("should still render nothing when offline", () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({
      isOnline: false,
      isInitialized: true,
    });

    const { container } = render(<OfflineRedirector />);
    expect(container.firstChild).toBeNull();
  });
});
