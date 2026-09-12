import { normalizeIds } from "@/libs/utils/normalizeIds";
import { songIdSchema } from "@/electron/lib/ipc-validate";
import { Song, Playlist } from "@/types";

describe("normalizeIds", () => {
  it("Supabaseが返す数値IDを文字列に変換する", () => {
    // songs.id / playlists.id は数値カラムのため JSON では number で返る
    const rows = [
      { id: 104, title: "Scroll Back" },
      { id: 93, title: "Beyond Recall" },
    ] as unknown as Song[];

    const songs = normalizeIds(rows);

    expect(songs.map((s) => s.id)).toEqual(["104", "93"]);
    songs.forEach((s) => expect(typeof s.id).toBe("string"));
  });

  it("正規化したIDはIPCのsongIdSchema検証を通る", () => {
    const rows = [{ id: 104, title: "Scroll Back" }] as unknown as Song[];

    const [song] = normalizeIds(rows);

    // 数値のままだと "Invalid input" で IPC が失敗する
    expect(songIdSchema.safeParse(rows[0].id).success).toBe(false);
    expect(songIdSchema.safeParse(song.id).success).toBe(true);
  });

  it("曲以外（プレイリスト）のIDも文字列に変換する", () => {
    const rows = [
      { id: 73, title: "playlist1" },
      { id: 74, title: "Vapor wave remix" },
    ] as unknown as Playlist[];

    expect(normalizeIds(rows).map((p) => p.id)).toEqual(["73", "74"]);
  });

  it("文字列IDはそのまま保持する", () => {
    const rows = [{ id: "local_abc123", title: "Local Song" }] as Song[];

    expect(normalizeIds(rows)[0].id).toBe("local_abc123");
  });

  it("他のフィールドは変更しない", () => {
    const rows = [
      { id: 1, title: "Song", author: "Artist", genre: "Rock" },
    ] as unknown as Song[];

    const [song] = normalizeIds(rows);

    expect(song).toMatchObject({
      title: "Song",
      author: "Artist",
      genre: "Rock",
    });
  });

  it("null/undefinedの場合は空配列を返す", () => {
    expect(normalizeIds(null)).toEqual([]);
    expect(normalizeIds(undefined)).toEqual([]);
  });
});
