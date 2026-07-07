import { isNavigationAllowed } from "@/electron/lib/navigation";

describe("electron/lib/navigation isNavigationAllowed", () => {
  it("allows the local dev/standalone server", () => {
    expect(isNavigationAllowed("http://localhost:3000")).toBe(true);
    expect(isNavigationAllowed("http://localhost:13000")).toBe(true);
  });

  it("allows the custom badwave scheme", () => {
    expect(isNavigationAllowed("badwave://file/C:/x.mp3")).toBe(true);
  });

  it("allows trusted OAuth provider hosts (Supabase / Google)", () => {
    expect(
      isNavigationAllowed("https://project.supabase.co/auth/v1/callback"),
    ).toBe(true);
    expect(
      isNavigationAllowed("https://accounts.google.com/o/oauth2/auth"),
    ).toBe(true);
    // サブドメインも許可 (例: <region>.supabase.in)
    expect(
      isNavigationAllowed("https://xyz.supabase.in/oauth/callback"),
    ).toBe(true);
  });

  it("blocks arbitrary external hosts and non-http schemes", () => {
    expect(isNavigationAllowed("https://evil.com/steal")).toBe(false);
    expect(isNavigationAllowed("https://example.com")).toBe(false);
    expect(isNavigationAllowed("file:///C:/x")).toBe(false);
    expect(isNavigationAllowed("ftp://example.com")).toBe(false);
  });
});
