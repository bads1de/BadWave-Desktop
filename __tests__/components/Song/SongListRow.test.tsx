/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import SongListRow from "@/components/song/SongListRow";
import { useUser } from "@/hooks/auth/useUser";
import { Song } from "@/types";

jest.mock("@/hooks/auth/useUser", () => ({
  useUser: jest.fn(),
}));

jest.mock("@/components/song/SongList", () => ({
  __esModule: true,
  default: ({ onClick }: { onClick?: () => void }) => (
    <button data-testid="song-list" onClick={onClick} />
  ),
}));

jest.mock("@/components/song/SongOptionsPopover", () => ({
  __esModule: true,
  default: () => <div data-testid="song-options" />,
}));

describe("SongListRow", () => {
  const song: Song = {
    id: "song-1",
    title: "Song 1",
    author: "Artist 1",
    image_path: "/img1.jpg",
    song_path: "/s1.mp3",
    count: "100",
    like_count: "10",
    genre: "Pop",
    created_at: "2023-01-01",
    user_id: "u1",
  };

  const onPlay = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: { id: "user-1" } });
  });

  it("曲の行とオプションを表示すること", () => {
    render(<SongListRow song={song} onPlay={onPlay} />);

    expect(screen.getByTestId("song-list")).toBeInTheDocument();
    expect(screen.getByTestId("song-options")).toBeInTheDocument();
  });

  it("クリックすると曲IDでonPlayを呼ぶこと", () => {
    render(<SongListRow song={song} onPlay={onPlay} />);

    fireEvent.click(screen.getByTestId("song-list"));

    expect(onPlay).toHaveBeenCalledWith("song-1");
  });

  it("hideOptionsWhenSignedOutで未ログイン時はオプションを隠すこと", () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });

    render(
      <SongListRow song={song} onPlay={onPlay} hideOptionsWhenSignedOut />
    );

    expect(screen.queryByTestId("song-options")).not.toBeInTheDocument();
  });

  it("既定では未ログイン時もオプションを表示すること", () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });

    render(<SongListRow song={song} onPlay={onPlay} />);

    expect(screen.getByTestId("song-options")).toBeInTheDocument();
  });

  it("optionsOnHoverでホバー用のグループクラスを付与すること", () => {
    const { container } = render(
      <SongListRow song={song} onPlay={onPlay} optionsOnHover />
    );

    expect(container.firstChild).toHaveClass("group/item");
  });
});
