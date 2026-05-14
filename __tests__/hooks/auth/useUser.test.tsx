/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MyUserContextProvider, useUser, UserContext } from "@/hooks/auth/useUser";
import { createClient } from "@/libs/supabase/client";
import { electronAPI } from "@/libs/electron/index";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";

jest.mock("@/libs/supabase/client");
jest.mock("@/libs/electron/index");
jest.mock("@/hooks/utils/useNetworkStatus");
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn().mockReturnValue({ data: null, isLoading: false }),
}));
jest.mock("@/constants", () => ({
  CACHE_CONFIG: { staleTime: 60000, gcTime: 300000 },
  CACHED_QUERIES: { userDetails: "user-details" },
}));

const mockSubscribe = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
const mockAuthStateChange = {
  data: { subscription: { unsubscribe: jest.fn() } },
};

describe("useUser", () => {
  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue(mockAuthStateChange),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (electronAPI.isElectron as jest.Mock).mockReturnValue(false);
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true, isInitialized: true });
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  });

  it("should throw error when used outside provider", () => {
    expect(() => {
      renderHook(() => useUser());
    }).toThrow("useUser must be used within a MyUserContextProvider");
  });

  it("should provide default values when no session exists", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MyUserContextProvider>{children}</MyUserContextProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.userDetails).toBeNull();
  });

  it("should set user from session when logged in", async () => {
    const mockUser = { id: "user-1", email: "test@test.com" };
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser, access_token: "token-123" } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MyUserContextProvider>{children}</MyUserContextProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.accessToken).toBe("token-123");
  });

  it("should restore cached user in Electron environment", async () => {
    (electronAPI.isElectron as jest.Mock).mockReturnValue(true);
    electronAPI.auth = {
      getCachedUser: jest.fn().mockResolvedValue({
        id: "cached-1",
        email: "cached@test.com",
        avatarUrl: "http://example.com/avatar.jpg",
      }),
      saveCachedUser: jest.fn().mockResolvedValue({ success: true }),
      clearCachedUser: jest.fn().mockResolvedValue({ success: true }),
    };
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "cached-1", email: "cached@test.com" }, access_token: "token" } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MyUserContextProvider>{children}</MyUserContextProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.user).toBeDefined();
  });
});
