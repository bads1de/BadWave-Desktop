"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOAuthServer = startOAuthServer;
exports.stopOAuthServer = stopOAuthServer;
var electron_1 = require("electron");
var http = __importStar(require("http"));
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var utils_1 = require("../utils");
var oauthServer = null;
function startOAuthServer() {
    if (oauthServer)
        return;
    oauthServer = http.createServer(function (req, res) {
        var _a;
        if ((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith("/auth/callback")) {
            var url = new URL(req.url, "http://localhost:4321");
            var code = url.searchParams.get("code");
            var error = url.searchParams.get("error");
            var htmlPath = path.join(__dirname, "static", "auth-callback.html");
            var html = fs.readFileSync(htmlPath, "utf-8");
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
            var mainWindow = electron_1.BrowserWindow.getAllWindows()[0];
            if (mainWindow && !mainWindow.isDestroyed()) {
                if (code) {
                    mainWindow.webContents.send("auth-callback", { code: code });
                }
                else if (error) {
                    mainWindow.webContents.send("auth-callback", { error: error });
                }
            }
        }
        else {
            res.writeHead(404);
            res.end("Not Found");
        }
    });
    oauthServer.listen(4321, function () {
        (0, utils_1.debugLog)("[OAuth] HTTPサーバーがlocalhost:4321で起動しました");
    });
}
function stopOAuthServer() {
    if (oauthServer) {
        oauthServer.close(function () {
            (0, utils_1.debugLog)("[OAuth] HTTPサーバーを停止しました");
        });
        oauthServer = null;
    }
}
//# sourceMappingURL=oauth-server.js.map