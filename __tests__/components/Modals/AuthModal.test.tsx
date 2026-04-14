import React from "react";
import { render, screen, act } from "@testing-library/react";
import AuthModal from "@/components/modals/AuthModal";
import useAuthModal from "@/hooks/auth/useAuthModal";
import { createClient } from "@/libs/supabase/client";

jest.mock("@/hooks/auth/useAuthModal");
jest.mock("@/libs/supabase/client");
jest.mock("@supabase/auth-ui-react", () => ({
  Auth: () => <div data-testid="supabase-auth">Supabase Auth</div>,
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

describe("AuthModal", () => {
  const mockOnClose = jest.fn();
  const mockSupabase = {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuthModal as jest.Mock).mockReturnValue({
      isOpen: true,
      onClose: mockOnClose,
    });

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it("renders modal when isOpen is true", async () => {
    await act(async () => {
      render(<AuthModal />);
    });
    expect(screen.getByText("おかえりなさい")).toBeInTheDocument();
    expect(screen.getByText("ログインしてください")).toBeInTheDocument();
  });

  it("renders Supabase Auth component", async () => {
    await act(async () => {
      render(<AuthModal />);
    });
    expect(screen.getByTestId("supabase-auth")).toBeInTheDocument();
  });

  it("calls onClose when modal is closed", async () => {
    await act(async () => {
      render(<AuthModal />);
    });
    // Modal onChange が false で呼ばれると onClose が呼ばれる
    expect(screen.getByText("おかえりなさい")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    (useAuthModal as jest.Mock).mockReturnValue({
      isOpen: false,
      onClose: mockOnClose,
    });

    render(<AuthModal />);
    // モーダルが閉じている場合はタイトルが表示されない
    expect(screen.queryByText("おかえりなさい")).not.toBeInTheDocument();
  });
});
