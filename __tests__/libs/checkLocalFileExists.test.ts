/**
 * @jest-environment jsdom
 */
import { checkLocalFileExists } from "@/libs/electron/files";

describe("checkLocalFileExists", () => {
  const mockInvoke = (window as any).electron.ipc.invoke as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call IPC with file path and return true when file exists", async () => {
    mockInvoke.mockResolvedValue(true);

    const result = await checkLocalFileExists("C:\\Users\\test\\song.mp3");

    expect(result).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith(
      "check-local-file-exists",
      "C:\\Users\\test\\song.mp3"
    );
  });

  it("should return false when file does not exist", async () => {
    mockInvoke.mockResolvedValue(false);

    const result = await checkLocalFileExists("C:\\Users\\test\\missing.mp3");

    expect(result).toBe(false);
  });

  it("should return false when IPC call fails", async () => {
    mockInvoke.mockRejectedValue(new Error("IPC error"));

    const result = await checkLocalFileExists("C:\\Users\\test\\song.mp3");

    expect(result).toBe(false);
  });
});
