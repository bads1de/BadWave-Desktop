/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { AccountModal } from "@/components/account/AccountModal";

jest.mock("@/hooks/mutations/useUpdateUserProfileMutation", () => () => ({
  updateProfile: { mutate: jest.fn(), isPending: false },
  updateAvatar: { mutate: jest.fn(), isPending: false },
  updatePassword: { mutate: jest.fn(), isPending: false },
}));

jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "https://example.com/avatar.jpg" } }),
      })),
    },
  })),
}));

jest.mock("@/components/modals/Modal", () => ({ children, isOpen, title }: any) =>
  isOpen ? <div data-testid="modal"><h2>{title}</h2>{children}</div> : null
);

describe("AccountModal", () => {
  const mockUser = { id: "user-1", full_name: "Test User", avatar_url: "/avatar.jpg" };

  it("should render account information", () => {
    render(<AccountModal isOpen={true} onClose={jest.fn()} user={mockUser} />);
    expect(screen.getByText(/プロフィール編集/i)).toBeInTheDocument();
  });
});
