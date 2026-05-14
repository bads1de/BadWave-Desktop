/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import PlaylistModal from "@/components/modals/PlaylistModal";
import usePlaylistModal from "@/hooks/modal/usePlaylistModal";

jest.mock("@/hooks/modal/usePlaylistModal");

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
  useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({ userDetails: { id: "test-user" } }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn(),
    })),
  })),
}));

describe("PlaylistModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePlaylistModal as unknown as jest.Mock).mockReturnValue({
      isOpen: true,
      onClose: jest.fn(),
    });
  });

  it("should render when open", () => {
    render(<PlaylistModal />);
    expect(screen.getByPlaceholderText("プレイリスト名")).toBeInTheDocument();
  });
});
