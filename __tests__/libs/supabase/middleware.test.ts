import { updateSession } from "@/libs/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, NextRequest } from "next/server";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

describe("libs/supabase/middleware", () => {
  const OLD_ENV = process.env;
  let mockRequest: any;
  let mockSupabase: any;
  let mockResponse: any;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    mockResponse = {
      cookies: {
        set: jest.fn(),
      },
    };

    // NextResponse.next のモックを各テストごとに制御できるように変更
    // 2回呼ばれる可能性があるため、それぞれ異なるレスポンスを返せるようにする
    const mockResponse1 = { cookies: { set: jest.fn() } };
    const mockResponse2 = { cookies: { set: jest.fn() } };
    (NextResponse.next as jest.Mock) = jest.fn()
      .mockReturnValueOnce(mockResponse1)
      .mockReturnValueOnce(mockResponse2);

    mockRequest = {
      headers: new Headers(),
      cookies: {
        getAll: jest.fn().mockReturnValue([{ name: "sb-auth", value: "token" }]),
        set: jest.fn(),
      },
      url: "http://localhost:3000",
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    };
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should update session and return response", async () => {
    const response = await updateSession(mockRequest as unknown as NextRequest);
    
    expect(createServerClient).toHaveBeenCalled();
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    // 2回目に作成されたレスポンスが返されるはず
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("should handle cookie operations in middleware", async () => {
    const mockResp1 = { cookies: { set: jest.fn() } };
    const mockResp2 = { cookies: { set: jest.fn() } };
    (NextResponse.next as jest.Mock) = jest.fn()
      .mockReturnValueOnce(mockResp1)
      .mockReturnValueOnce(mockResp2);

    (createServerClient as jest.Mock).mockImplementation((url, key, options) => {
      return {
        auth: {
          getUser: async () => {
            options.cookies.getAll();
            options.cookies.setAll([{ name: "test", value: "val", options: { path: "/" } }]);
            return { data: { user: null } };
          }
        }
      };
    });

    await updateSession(mockRequest as unknown as NextRequest);
    
    expect(mockRequest.cookies.getAll).toHaveBeenCalled();
    expect(mockRequest.cookies.set).toHaveBeenCalledWith("test", "val");
    // 2回目のレスポンス（再代入されたもの）に対して呼ばれるはず
    expect(mockResp2.cookies.set).toHaveBeenCalledWith("test", "val", { path: "/" });
  });
});
