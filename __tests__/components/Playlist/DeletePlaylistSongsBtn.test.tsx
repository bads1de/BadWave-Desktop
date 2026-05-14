/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DeletePlaylistSongsBtn from "@/components/playlist/DeletePlaylistSongsBtn";

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({ user: { id: "test-user" } }),
}));

jest.mock("@/hooks/utils/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: true }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-hot-toast", () => ({
  default: { error: jest.fn(), success: jest.fn() },
}));

jest.mock("@/libs/electron", () => ({
  isElectron: () => false,
  cache: { get: jest.fn(), set: jest.fn() },
}));

jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
      select: jest.fn(),
    })),
  })),
}));

describe("DeletePlaylistSongsBtn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render delete button", () => {
    render(<DeletePlaylistSongsBtn songId="song-1" playlistId="playlist-1" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should show text when showText is true", () => {
    render(<DeletePlaylistSongsBtn songId="song-1" playlistId="playlist-1" showText />);
    expect(screen.getByText("削除")).toBeInTheDocument();
  });
});
