/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PlaylistCard from "@/components/playlist/PlaylistCard";
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

describe("PlaylistCard", () => {
  const mockPlaylist = {
    id: "pl-1",
    title: "Playlist 1",
    image_path: "/img1.jpg",
    user_name: "User 1",
  };

  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  const renderCard = (props: Record<string, unknown> = {}) =>
    render(
      <PlaylistCard
        playlist={mockPlaylist as any}
        href="/playlists/pl-1"
        {...props}
      >
        <h3>{mockPlaylist.title}</h3>
      </PlaylistCard>
    );

  it("should render the artwork and the info block", () => {
    renderCard();

    expect(screen.getByAltText("Playlist 1")).toHaveAttribute(
      "src",
      "/img1.jpg"
    );
    expect(screen.getByText("Playlist 1")).toBeInTheDocument();
  });

  it("should fall back to the default artwork", () => {
    render(
      <PlaylistCard
        playlist={{ id: "pl-2", title: "Playlist 2" } as any}
        href="/playlists/pl-2"
      />
    );

    expect(screen.getByAltText("Playlist 2")).toHaveAttribute(
      "src",
      "/images/playlist.png"
    );
  });

  it("should navigate to href when clicked", () => {
    const { container } = renderCard();

    fireEvent.click(container.firstElementChild!);

    expect(mockPush).toHaveBeenCalledWith("/playlists/pl-1");
  });

  it("should render the header, overlay and children slots", () => {
    renderCard({
      header: <span>HEADER_SLOT</span>,
      imageOverlay: <span>OVERLAY_SLOT</span>,
    });

    expect(screen.getByText("HEADER_SLOT")).toBeInTheDocument();
    expect(screen.getByText("OVERLAY_SLOT")).toBeInTheDocument();
    expect(screen.getByText("Playlist 1")).toBeInTheDocument();
  });

  it("should keep the page specific classes", () => {
    const { container } = renderCard({
      className: "cyber-glitch",
      cardClassName: "group-hover:-translate-y-2 rounded-none",
    });

    expect(container.firstElementChild).toHaveClass("cyber-glitch");
    expect(container.querySelector(".rounded-none")).not.toBeNull();
  });

  it("should let callers override the default classes", () => {
    const { container } = renderCard({
      className: "min-w-[200px] max-w-[200px]",
      cardClassName: "p-0 overflow-hidden rounded-xl",
      artworkClassName: "mb-0 border-0",
      sizes: "200px",
    });

    const card = container.querySelector(".rounded-xl")!;
    expect(card).not.toHaveClass("p-4");
    expect(card).toHaveClass("overflow-hidden");

    expect(container.querySelector(".aspect-square")).not.toHaveClass("mb-4");
    expect(container.firstElementChild).toHaveClass("min-w-[200px]");
    expect(screen.getByAltText("Playlist 1")).toHaveAttribute("sizes", "200px");
  });
});
