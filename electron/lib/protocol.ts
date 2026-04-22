import { protocol, app } from "electron";
import * as url from "url";

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
      },
    },
  ]);
}

// プロトコルハンドラーの登録
export function registerProtocolHandlers() {
  // appプロトコルのハンドラー
  registerAppProtocol();
  // badwaveプロトコルのハンドラー（認証コールバック用）
  registerBadwaveProtocol();
}

// appプロトコルのハンドラーを登録
function registerAppProtocol() {
  protocol.registerFileProtocol(
    "app",
    (
      request: Electron.ProtocolRequest,
      callback: (response: string) => void
    ) => {
      const filePath = url.fileURLToPath(
        "file://" + request.url.slice("app://".length)
      );
      callback(filePath);
    }
  );
}

// badwaveプロトコルのハンドラーを登録（認証コールバック用）
function registerBadwaveProtocol() {
  protocol.handle("badwave", async (request) => {
    const urlObj = new URL(request.url);

    // 認証コールバックを処理
    if (urlObj.pathname === "/auth/callback") {
      const code = urlObj.searchParams.get("code");
      const error = urlObj.searchParams.get("error");

      if (error) {
        // メインウィンドウにエラーを送信
        const { BrowserWindow } = require("electron");
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("auth-callback", { error });
        }
        return new Response(
          HTMLResponse("認証に失敗しました。このタブを閉じてアプリに戻ってください。"),
          { headers: { "Content-Type": "text/html" } }
        );
      }

      if (code) {
        // 認証コードをIPC経由でレンダラープロセスに送信
        const { BrowserWindow } = require("electron");
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("auth-callback", { code });
        }
        return new Response(
          HTMLResponse("認証成功！このタブを閉じてアプリに戻ってください。"),
          { headers: { "Content-Type": "text/html" } }
        );
      }
    }

    // ローカルファイルへのアクセス
    if (urlObj.hostname === "file") {
      try {
        const encodedPath = urlObj.pathname.slice(1); // 先頭の '/' を削除
        const filePath = decodeURIComponent(encodedPath);

        // ディレクトリトラバーサル対策
        if (filePath.includes("..")) {
          return new Response("Forbidden", { status: 403 });
        }

        const { net } = require("electron");
        return await net.fetch(url.pathToFileURL(filePath).toString());
      } catch (err) {
        console.error("Local file fetch error:", err);
        return new Response("Not Found", { status: 404 });
      }
    }

    return new Response("Not Found", { status: 404 });
  });
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
