import { protocol } from "electron";
import * as url from "url";
import { serveLocalFile } from "./localFileHandler";

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
  registerAppProtocol();
  registerBadwaveProtocol();
}

// appプロトコルのハンドラーを登録
function registerAppProtocol() {
  protocol.registerFileProtocol(
    "app",
    (request, callback) => {
      const filePath = url.fileURLToPath(
        "file://" + request.url.slice("app://".length)
      );
      callback(filePath);
    }
  );
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

    return new Response("Not Found", { status: 404 });
  });
}

// 認証コールバックの処理
function handleAuthCallback(urlObj: URL): Response {
  const code = urlObj.searchParams.get("code");
  const error = urlObj.searchParams.get("error");

  const { BrowserWindow } = require("electron");
  const mainWindow = BrowserWindow.getAllWindows()[0];

  if (error) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("auth-callback", { error });
    }
    return new Response(
      HTMLResponse("認証に失敗しました。このタブを閉じてアプリに戻ってください。"),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (code) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("auth-callback", { code });
    }
    return new Response(
      HTMLResponse("認証成功！このタブを閉じてアプリに戻ってください。"),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  return new Response("Bad Request", { status: 400 });
}

function HTMLResponse(message: string): string {
  return `
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
  `;
}
