import { CHANNELS } from "../channels";
import { protocol } from "electron";
import { serveLocalFile } from "./local-file-handler";
import { sendToMainWindow } from "./window-manager";

// カスタムプロトコルのスキームを登録（app ready前に呼び出す必要あり）
export function registerSchemes() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "badwave",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        bypassCSP: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

// プロトコルハンドラーの登録
export function registerProtocolHandlers() {
  registerBadwaveProtocol();
}

// badwaveプロトコルのハンドラーを登録
function registerBadwaveProtocol() {
  protocol.handle("badwave", async (request) => {
    const urlObj = new URL(request.url);

    // 認証コールバック
    if (urlObj.pathname === "/auth/callback") {
      return handleAuthCallback(urlObj);
    }

    // ローカルファイルへのアクセス
    if (urlObj.hostname === "file") {
      return serveLocalFile(request, urlObj);
    }

    // hostname が file 以外（badwave://C:/... 形式など）も拾う
    if (
      urlObj.protocol === "badwave:" &&
      urlObj.pathname &&
      urlObj.pathname !== "/auth/callback"
    ) {
      return serveLocalFile(request, urlObj);
    }

    return new Response("Not Found", { status: 404 });
  });
}

// 認証コールバックの処理
function handleAuthCallback(urlObj: URL): Response {
  const code = urlObj.searchParams.get("code");
  const error = urlObj.searchParams.get("error");

  if (error) {
    sendToMainWindow(CHANNELS.AUTH_CALLBACK, { error });
    return authCallbackPage(
      "認証に失敗しました。このタブを閉じてアプリに戻ってください。",
    );
  }

  if (code) {
    sendToMainWindow(CHANNELS.AUTH_CALLBACK, { code });
    return authCallbackPage(
      "認証成功！このタブを閉じてアプリに戻ってください。",
    );
  }

  return new Response("Bad Request", { status: 400 });
}

/** 認証コールバック時に表示するHTMLページ */
function authCallbackPage(message: string): Response {
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>認証完了</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        h1 { margin-bottom: 20px; }
        p { font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎉</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `,
    { headers: { "Content-Type": "text/html" } },
  );
}
