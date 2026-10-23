import { z } from "zod";
import { handleIpc, handleValidatedIpc } from "../../../electron/lib/ipc-handler";

const mockHandlers = new Map<
  string,
  (event: unknown, input: unknown) => Promise<unknown>
>();

jest.mock("electron", () => ({
  ipcMain: {
    handle: (
      channel: string,
      listener: (event: unknown, input: unknown) => Promise<unknown>,
    ) => {
      mockHandlers.set(channel, listener);
    },
  },
}));

describe("electron/lib/ipc-handler", () => {
  beforeEach(() => {
    mockHandlers.clear();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("検証済み入力をハンドラへ渡して結果を返す", async () => {
    handleValidatedIpc("test-channel", z.string(), (input) =>
      input.toUpperCase(),
    );

    const listener = mockHandlers.get("test-channel");
    await expect(listener?.(null, "abc")).resolves.toBe("ABC");
  });

  it("入力検証の失敗を reject する（空配列に変換しない）", async () => {
    handleValidatedIpc("test-channel", z.string(), (input) => input);

    const listener = mockHandlers.get("test-channel");
    await expect(listener?.(null, 123)).rejects.toThrow("Invalid input");
  });

  it("ハンドラ内の例外を reject する（空配列に変換しない）", async () => {
    handleIpc("test-channel", async () => {
      throw new Error("DB is locked");
    });

    const listener = mockHandlers.get("test-channel");
    await expect(listener?.(null, undefined)).rejects.toThrow("DB is locked");
  });

  it("エラーをチャンネル名付きでログに残す", async () => {
    handleIpc("test-channel", async () => {
      throw new Error("boom");
    });

    const listener = mockHandlers.get("test-channel");
    await expect(listener?.(null, undefined)).rejects.toThrow("boom");
    expect(console.error).toHaveBeenCalledWith(
      "[IPC:test-channel] error:",
      expect.any(Error),
    );
  });
});
