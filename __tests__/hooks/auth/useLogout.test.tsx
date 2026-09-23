/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import useLogout from "@/hooks/auth/useLogout";
import { createClient } from "@/libs/supabase/client";
import { toast } from "react-hot-toast";
import { ERROR_MESSAGES } from "@/constants/errorMessages";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("@/libs/supabase/client", () => ({
  createClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("hooks/auth/useLogout", () => {
  let mockSignOut: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockReturnValue({
      auth: { signOut: mockSignOut },
    });
  });

  it("ログアウト後にホームへ遷移すること", async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(toast.success).toHaveBeenCalledWith("ログアウトしました");
  });

  it("redirectToにnullを指定した場合は遷移せず再取得すること", async () => {
    const { result } = renderHook(() =>
      useLogout({ successMessage: "LOGOUT_SUCCESSFUL", redirectTo: null })
    );

    await act(async () => {
      await result.current.logout();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("LOGOUT_SUCCESSFUL");
  });

  it("ログアウトに失敗した場合はエラーを表示すること", async () => {
    mockSignOut.mockRejectedValue(new Error("signOut failed"));
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.LOGOUT_FAILED);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("signOut が throw せず error を返した場合もエラーを表示すること", async () => {
    // Supabase の signOut は throw せず { error } を返すことが多い
    mockSignOut.mockResolvedValue({ error: new Error("signOut failed") });
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.LOGOUT_FAILED);
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("処理中はisLoadingがtrueになること", async () => {
    let resolveSignOut: (value: unknown) => void = () => {};
    mockSignOut.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignOut = resolve;
        })
    );

    const { result } = renderHook(() => useLogout());

    expect(result.current.isLoading).toBe(false);

    let logoutPromise: Promise<void>;
    act(() => {
      logoutPromise = result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolveSignOut({ error: null });
      await logoutPromise!;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
