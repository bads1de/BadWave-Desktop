/**
 * @jest-environment node
 */
import { checkIsAdmin } from "@/actions/checkAdmin";
import { isCurrentUserAdmin } from "@/libs/admin";

jest.mock("@/libs/admin");

describe("checkIsAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return { isAdmin: true } when user is admin", async () => {
    (isCurrentUserAdmin as jest.Mock).mockResolvedValue(true);
    const result = await checkIsAdmin();
    expect(result).toEqual({ isAdmin: true });
  });

  it("should return { isAdmin: false } when user is not admin", async () => {
    (isCurrentUserAdmin as jest.Mock).mockResolvedValue(false);
    const result = await checkIsAdmin();
    expect(result).toEqual({ isAdmin: false });
  });
});
