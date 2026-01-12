/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import usePlayHistory from "@/hooks/player/usePlayHistory";

// Mocks
const mockInsert = jest.fn();
const mockFrom = jest.fn(() => ({
  insert: mockInsert,
}));

jest.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

const mockUseUser = jest.fn();
jest.mock("@/hooks/auth/useUser", () => ({
  useUser: () => mockUseUser(),
}));

describe("usePlayHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it("should record play history if user is logged in", async () => {
    mockUseUser.mockReturnValue({ userDetails: { id: "user-123" } });

    const { result } = renderHook(() => usePlayHistory());

    await act(async () => {
      await result.current.recordPlay("song-123");
    });

    expect(mockFrom).toHaveBeenCalledWith("play_history");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      song_id: "song-123",
    });
  });

  it("should not record if user is not logged in", async () => {
    mockUseUser.mockReturnValue({ userDetails: null });

    const { result } = renderHook(() => usePlayHistory());

    await act(async () => {
      await result.current.recordPlay("song-123");
    });

    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("should not record if songId is missing", async () => {
    mockUseUser.mockReturnValue({ userDetails: { id: "user-123" } });

    const { result } = renderHook(() => usePlayHistory());

    await act(async () => {
      await result.current.recordPlay("");
    });

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("should handle error gracefully", async () => {
    mockUseUser.mockReturnValue({ userDetails: { id: "user-123" } });
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockInsert.mockResolvedValue({ error: { message: "DB Error" } });

    const { result } = renderHook(() => usePlayHistory());

    await act(async () => {
      await result.current.recordPlay("song-123");
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "再生の記録中にエラーが発生しました:",
      { message: "DB Error" }
    );
    consoleSpy.mockRestore();
  });
});
