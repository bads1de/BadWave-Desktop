import { BrowserWindow } from "electron";
import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import { debugLog } from "../utils";

let oauthServer: http.Server | null = null;

export function startOAuthServer() {
  if (oauthServer) return;

  oauthServer = http.createServer((req, res) => {
    if (req.url?.startsWith("/auth/callback")) {
      const url = new URL(req.url, `http://localhost:4321`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      const htmlPath = path.join(__dirname, "static", "auth-callback.html");
      const html = fs.readFileSync(htmlPath, "utf-8");

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);

      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (code) {
          mainWindow.webContents.send("auth-callback", { code });
        } else if (error) {
          mainWindow.webContents.send("auth-callback", { error });
        }
      }
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  oauthServer.listen(4321, () => {
    debugLog("[OAuth] HTTPサーバーがlocalhost:4321で起動しました");
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
