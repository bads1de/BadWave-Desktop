/**
 * @jest-environment node
 */
import { getListeningStats } from "@/actions/getStats";
import { createClient } from "@/libs/supabase/server";

jest.mock("@/libs/supabase/server");

describe("getListeningStats", () => {
  const mockUser = { id: "user-1" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null when user is not authenticated", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    const result = await getListeningStats("week");
    expect(result).toBeNull();
  });

  it("should return null when auth error occurs", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Auth error" },
        }),
      },
    });

    const result = await getListeningStats("week");
    expect(result).toBeNull();
  });

  it("should return stats data when authenticated", async () => {
    const mockStats = { totalPlays: 100, uniqueSongs: 20 };
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      rpc: jest.fn().mockReturnValue({
        then: jest.fn((resolve) => resolve({ data: mockStats, error: null })),
      }),
    });

    const result = await getListeningStats("week");
    expect(result).toEqual(mockStats);
  });

  it("should return null on rpc error", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      rpc: jest.fn().mockReturnValue({
        then: jest.fn((resolve) => resolve({ data: null, error: { message: "RPC error" } })),
      }),
    });

    const result = await getListeningStats("month");
    expect(result).toBeNull();
  });

  it("should handle 'all' period", async () => {
    const mockStats = { totalPlays: 5000, uniqueSongs: 200 };
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      rpc: jest.fn().mockReturnValue({
        then: jest.fn((resolve) => resolve({ data: mockStats, error: null })),
      }),
    });

    const result = await getListeningStats("all");
    expect(result).toEqual(mockStats);
  });
});
