/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LikeButton from "@/components/LikeButton";
import { useUser } from "@/hooks/auth/useUser";
import useLikeStatus from "@/hooks/data/useLikeStatus";
import useLikeMutation from "@/hooks/mutations/useLikeMutation";
import useAuthModal from "@/hooks/auth/useAuthModal";

// Mock hooks
jest.mock("@/hooks/auth/useUser");
jest.mock("@/hooks/data/useLikeStatus");
jest.mock("@/hooks/mutations/useLikeMutation");
jest.mock("@/hooks/auth/useAuthModal");

describe("LikeButton", () => {
  const songId = "song-1";
  const userId = "user-1";

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: { id: userId } });
    (useLikeStatus as jest.Mock).mockReturnValue({ isLiked: false });
    (useLikeMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (useAuthModal as jest.Mock).mockReturnValue({ onOpen: jest.fn() });
  });

  it("should render heart icon", () => {
    render(<LikeButton songId={songId} songType="regular" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should call mutate when clicked and logged in", () => {
    const mockMutate = jest.fn();
    (useLikeMutation as jest.Mock).mockReturnValue({ mutate: mockMutate, isPending: false });

    render(<LikeButton songId={songId} songType="regular" />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockMutate).toHaveBeenCalledWith(false);
  });

  it("should open auth modal when clicked and not logged in", () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });
    const mockOnOpen = jest.fn();
    (useAuthModal as jest.Mock).mockReturnValue({ onOpen: mockOnOpen });

    render(<LikeButton songId={songId} songType="regular" />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockOnOpen).toHaveBeenCalled();
  });

  it("should show liked state", () => {
    (useLikeStatus as jest.Mock).mockReturnValue({ isLiked: true });
    render(<LikeButton songId={songId} songType="regular" />);
    
    expect(screen.getByLabelText("Remove like")).toBeInTheDocument();
  });
});
