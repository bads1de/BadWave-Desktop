import { createClient } from "@/libs/supabase/client";
import { createBrowserClient } from "@supabase/ssr";

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(),
}));

describe("libs/supabase/client", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should create a supabase browser client with correct env variables", () => {
    createClient();
    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key"
    );
  });
});
