import { CHANNELS } from "../channels";
import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import { debugLog } from "../utils";
import { sendToMainWindow } from "./window-manager";

let oauthServer: http.Server | null = null;

export function startOAuthServer() {
  if (oauthServer) return;

  oauthServer = http.createServer((req, res) => {
    // ハンドラー内の例外は HTTP サーバーが拾わずメインプロセスが落ちるため、
    // ここで握って 500 を返す
    try {
      if (req.url?.startsWith("/auth/callback")) {
        const url = new URL(req.url, `http://localhost:4321`);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        const htmlPath = path.join(__dirname, "static", "auth-callback.html");
        const html = fs.readFileSync(htmlPath, "utf-8");

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);

        if (code) {
          sendToMainWindow(CHANNELS.AUTH_CALLBACK, { code });
        } else if (error) {
          sendToMainWindow(CHANNELS.AUTH_CALLBACK, { error });
        }
      } else {
        res.writeHead(404);
        res.end("Not Found");
      }
    } catch (error) {
      console.error("[OAuth] リクエストの処理に失敗しました:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
      }
      // 既にレスポンスを返し済みの場合は二重 end しない
      if (!res.writableEnded) {
        res.end("Internal Server Error");
      }
    }
  });

  // ポート使用中などで listen に失敗すると 'error' が発火する。
  // リスナーが無いと未処理イベントでメインプロセスが落ちるため、ログのみで復帰させる
  oauthServer.on("error", (error) => {
    console.error("[OAuth] HTTPサーバーの起動に失敗しました:", error);
    // 次回 startOAuthServer() で再試行できるようにする
    oauthServer = null;
  });

  oauthServer.listen(4321, "127.0.0.1", () => {
    debugLog("[OAuth] HTTPサーバーが127.0.0.1:4321で起動しました");
  });
}

export function stopOAuthServer() {
  if (oauthServer) {
    oauthServer.close(() => {
      debugLog("[OAuth] HTTPサーバーを停止しました");
    });
    oauthServer = null;
  }
}
