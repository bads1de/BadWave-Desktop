/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import UploadModal from "@/components/modals/UploadModal";
import { useUploadModal } from "@/hooks/modal/useUploadModal";

jest.mock("@/hooks/modal/useUploadModal");

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

jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn(),
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

describe("UploadModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUploadModal as unknown as jest.Mock).mockReturnValue({
      isOpen: true,
      onClose: jest.fn(),
    });
  });

  it("should render upload form when open", () => {
    render(<UploadModal />);
    expect(screen.getByRole("form", { name: /アップロード/i })).toBeInTheDocument();
  });
});
