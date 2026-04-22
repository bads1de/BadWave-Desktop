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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchemes = registerSchemes;
exports.registerProtocolHandlers = registerProtocolHandlers;
var electron_1 = require("electron");
var url = __importStar(require("url"));
// カスタムプロトコルのスキームを登録（app ready前に呼び出す必要あり）
function registerSchemes() {
    electron_1.protocol.registerSchemesAsPrivileged([
        {
            scheme: "badwave",
            privileges: {
                standard: true,
                secure: true,
                supportFetchAPI: true,
            },
        },
    ]);
}
// プロトコルハンドラーの登録
function registerProtocolHandlers() {
    // appプロトコルのハンドラー
    registerAppProtocol();
    // badwaveプロトコルのハンドラー（認証コールバック用）
    registerBadwaveProtocol();
}
// appプロトコルのハンドラーを登録
function registerAppProtocol() {
    electron_1.protocol.registerFileProtocol("app", function (request, callback) {
        var filePath = url.fileURLToPath("file://" + request.url.slice("app://".length));
        callback(filePath);
    });
}
// badwaveプロトコルのハンドラーを登録（認証コールバック用）
function registerBadwaveProtocol() {
    var _this = this;
    electron_1.protocol.handle("badwave", function (request) { return __awaiter(_this, void 0, void 0, function () {
        var urlObj, code, error, BrowserWindow, mainWindow, BrowserWindow, mainWindow;
        return __generator(this, function (_a) {
            urlObj = new URL(request.url);
            // 認証コールバックを処理
            if (urlObj.pathname === "/auth/callback") {
                code = urlObj.searchParams.get("code");
                error = urlObj.searchParams.get("error");
                if (error) {
                    BrowserWindow = require("electron").BrowserWindow;
                    mainWindow = BrowserWindow.getAllWindows()[0];
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send("auth-callback", { error: error });
                    }
                    return [2 /*return*/, new Response(HTMLResponse("認証に失敗しました。このタブを閉じてアプリに戻ってください。"), { headers: { "Content-Type": "text/html" } })];
                }
                if (code) {
                    BrowserWindow = require("electron").BrowserWindow;
                    mainWindow = BrowserWindow.getAllWindows()[0];
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send("auth-callback", { code: code });
                    }
                    return [2 /*return*/, new Response(HTMLResponse("認証成功！このタブを閉じてアプリに戻ってください。"), { headers: { "Content-Type": "text/html" } })];
                }
            }
            return [2 /*return*/, new Response("Not Found", { status: 404 })];
        });
    }); });
}
function HTMLResponse(message) {
    return "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <meta charset=\"UTF-8\">\n      <title>\u8A8D\u8A3C\u5B8C\u4E86</title>\n      <style>\n        body {\n          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n          display: flex;\n          justify-content: center;\n          align-items: center;\n          height: 100vh;\n          margin: 0;\n          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n          color: white;\n        }\n        .container {\n          text-align: center;\n          padding: 40px;\n          background: rgba(255, 255, 255, 0.1);\n          border-radius: 20px;\n          backdrop-filter: blur(10px);\n        }\n        h1 { margin-bottom: 20px; }\n        p { font-size: 18px; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <h1>\uD83C\uDF89</h1>\n        <p>".concat(message, "</p>\n      </div>\n    </body>\n    </html>\n  ");
}
//# sourceMappingURL=protocol.js.map