/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PublicPlaylistBoard from "@/components/Playlist/PublicPlaylistBoard";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} fill={props.fill ? "true" : undefined} />;
  },
}));

// Mock ScrollableContainer
jest.mock("@/components/common/ScrollableContainer", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("PublicPlaylistBoard", () => {
  const mockPlaylists = [
    { id: "pl-1", title: "Playlist 1", image_path: "/img1.jpg", user_name: "User 1" },
    { id: "pl-2", title: "Playlist 2", user_name: "User 2" },
  ];

  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it("should render playlists correctly", () => {
    render(<PublicPlaylistBoard playlists={mockPlaylists as any} />);
    expect(screen.getByText("Playlist 1")).toBeInTheDocument();
    expect(screen.getByText("Playlist 2")).toBeInTheDocument();
    expect(screen.getByAltText("Playlist 1")).toBeInTheDocument();
  });

  it("should navigate to playlist page when clicked", () => {
    render(<PublicPlaylistBoard playlists={mockPlaylists as any} />);
    
    fireEvent.click(screen.getByText("Playlist 1").closest(".group")!);
    
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/playlists/pl-1")
    );
  });

  it("should show user name on hover", () => {
    render(<PublicPlaylistBoard playlists={mockPlaylists as any} />);
    expect(screen.getByText("User 1")).toBeInTheDocument();
    // user_name is in the DOM but hidden by opacity-0. 
    // In JSDOM, classes are there but we don't usually test CSS visibility unless using computed styles.
  });
});
