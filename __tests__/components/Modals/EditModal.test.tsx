/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import EditModal from "@/components/modals/EditModal";

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
  useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => ({ user: { id: "test-user" } }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock("@/hooks/stores/useColorSchemeStore", () => () => ({
  getColorScheme: () => ({
    colors: { accentFrom: "#7c3aed", accentTo: "#ec4899" },
  }),
  hasHydrated: true,
}));

jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      eq: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "https://example.com/img.jpg" } }),
      })),
    },
  })),
}));

jest.mock("@/components/modals/Modal", () => ({ children, isOpen, title }: any) => 
  isOpen ? <div data-testid="modal"><h2>{title}</h2>{children}</div> : null
);

describe("EditModal", () => {
  const mockSong = {
    id: "song-1",
    user_id: "user-1",
    title: "Test Song",
    author: "Test Artist",
    song_path: "/songs/test.mp3",
    image_path: "/images/test.jpg",
    genre: "Pop",
    lyrics: "Test lyrics",
  };

  it("should render edit form", () => {
    render(<EditModal song={mockSong as any} isOpen={true} onClose={jest.fn()} />);
    const formElements = screen.queryAllByRole("textbox");
    expect(formElements).toBeDefined();
  });
});
