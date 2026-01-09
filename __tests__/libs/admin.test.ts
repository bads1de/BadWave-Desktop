import {
  getAdminUserIds,
  isAdmin,
  isCurrentUserAdmin,
  requireAdmin,
} from "@/libs/admin";

// Supabase モック
const mockGetUser = jest.fn();
jest.mock("@/libs/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

describe("libs/admin", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getAdminUserIds", () => {
    it("環境変数が設定されていない場合、空の配列を返すこと", () => {
      delete process.env.ADMIN_USER_IDS;
      expect(getAdminUserIds()).toEqual([]);
    });

    it("環境変数からIDリストを正しく解析すること", () => {
      process.env.ADMIN_USER_IDS = "user1, user2,user3 ";
      expect(getAdminUserIds()).toEqual(["user1", "user2", "user3"]);
    });
  });

  describe("isAdmin", () => {
    beforeEach(() => {
      process.env.ADMIN_USER_IDS = "admin-id-1,admin-id-2";
    });

    it("管理者のIDの場合、trueを返すこと", () => {
      expect(isAdmin("admin-id-1")).toBe(true);
      expect(isAdmin("admin-id-2")).toBe(true);
    });

    it("管理者でないIDの場合、falseを返すこと", () => {
      expect(isAdmin("user-id-1")).toBe(false);
    });
  });

  describe("isCurrentUserAdmin", () => {
    beforeEach(() => {
      process.env.ADMIN_USER_IDS = "admin-id";
    });

    it("現在のユーザーが管理者の場合、trueを返すこと", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "admin-id" } },
        error: null,
      });

      const result = await isCurrentUserAdmin();
      expect(result).toBe(true);
    });

    it("現在のユーザーが管理者でない場合、falseを返すこと", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "regular-user" } },
        error: null,
      });

      const result = await isCurrentUserAdmin();
      expect(result).toBe(false);
    });

    it("ユーザーがログインしていない場合、falseを返すこと", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await isCurrentUserAdmin();
      expect(result).toBe(false);
    });

    it("エラーが発生した場合、falseを返すこと", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Auth Error" },
      });

      const result = await isCurrentUserAdmin();
      expect(result).toBe(false);
    });
  });

  describe("requireAdmin", () => {
    beforeEach(() => {
      process.env.ADMIN_USER_IDS = "admin-id";
    });

    it("管理者の場合、エラーを投げないこと", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "admin-id" } },
        error: null,
      });

      await expect(requireAdmin()).resolves.not.toThrow();
    });

    it("管理者でない場合、エラーを投げること", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "regular-user" } },
        error: null,
      });

      await expect(requireAdmin()).rejects.toThrow("管理者権限が必要です");
    });
  });
});
