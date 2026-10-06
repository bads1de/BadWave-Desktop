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

        const htmlPath = path.join(__dirname, "..", "static", "auth-callback.html");
        // oauth-server.ts は electron/lib/ 配下にあるため、static へは ".." で上がる。
        // 旧コードは path.join(__dirname, "static", ...) で electron/lib/static/ を
        // 参照していたため ENOENT → 500 になっていた。
        // 万が一 HTML が同梱漏れでも code の受け渡し自体は継続できるよう、
        // 読み込み失敗時はフォールバック HTML を返す。
        let html: string;
        try {
          html = fs.readFileSync(htmlPath, "utf-8");
        } catch (readError) {
          console.error(
            `[OAuth] コールバックHTMLの読み込みに失敗しました (${htmlPath}):`,
            readError,
          );
          html =
            '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>認証完了</title></head>' +
            '<body style="background:#0a0a0f;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">' +
            "<h1>認証が完了しました。このタブを閉じてアプリに戻ってください。</h1></body></html>";
        }

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
