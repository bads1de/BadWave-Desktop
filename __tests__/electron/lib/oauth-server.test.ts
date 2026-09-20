import { startOAuthServer, stopOAuthServer } from "../../../electron/lib/oauth-server";
import * as http from "http";

jest.mock("electron", () => ({
  app: {
    getAppPath: jest.fn().mockReturnValue("/test/path"),
    isPackaged: false,
  },
  BrowserWindow: {
    getAllWindows: jest.fn().mockReturnValue([]),
  },
}));

describe("oauth-server", () => {
  let listenSpy: jest.SpyInstance;

  beforeEach(() => {
    listenSpy = jest.spyOn(http.Server.prototype, "listen").mockImplementation(function(this: http.Server, ...args: any[]) {
      // Find the callback which is the last argument or second argument
      const callback = args[args.length - 1];
      if (typeof callback === "function") {
        callback();
      }
      return this;
    });
  });

  afterEach(() => {
    listenSpy.mockRestore();
    stopOAuthServer();
  });

  it("should bind to 127.0.0.1", () => {
    startOAuthServer();
    expect(listenSpy).toHaveBeenCalledWith(4321, "127.0.0.1", expect.any(Function));
  });

  it("listen に失敗してもクラッシュせず、再度起動を試みられる", () => {
    startOAuthServer();
    const server = listenSpy.mock.results[0].value as http.Server;

    // 'error' リスナーが無いと未処理イベントでメインプロセスが落ちる
    expect(() => server.emit("error", new Error("EADDRINUSE"))).not.toThrow();

    // エラー後は再度 listen できる（oauthServer が null に戻る）
    startOAuthServer();
    expect(listenSpy).toHaveBeenCalledTimes(2);
  });
});
