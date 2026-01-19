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
exports.setupTranscriptionHandlers = setupTranscriptionHandlers;
var electron_1 = require("electron");
var child_process_1 = require("child_process");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var https = __importStar(require("https"));
var http = __importStar(require("http"));
/**
 * トランスクライブ関連のIPCハンドラーをセットアップする
 */
function setupTranscriptionHandlers() {
    var _this = this;
    /**
     * LRC生成リクエスト
     * @param audioPath 音声ファイルのパス（ローカルまたはURL）
     * @param lyricsText 歌詞テキスト
     */
    electron_1.ipcMain.handle("transcribe:generate-lrc", function (_event, audioPath, lyricsText) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    // Python環境のパス解決
                    var isDev = !electron_1.app.isPackaged;
                    var pythonPath = "";
                    var scriptPath = "";
                    if (isDev) {
                        var rootDir = path.join(__dirname, "../..");
                        pythonPath = path.join(rootDir, "python", "venv", "Scripts", "python.exe");
                        scriptPath = path.join(rootDir, "python", "lrc_generator.py");
                    }
                    else {
                        pythonPath = path.join(process.resourcesPath, "ai", "venv", "Scripts", "python.exe");
                        scriptPath = path.join(process.resourcesPath, "ai", "lrc_generator.py");
                    }
                    console.log("[Transcribe] Request - Path: ".concat(audioPath));
                    if (!fs.existsSync(pythonPath)) {
                        return resolve({
                            status: "error",
                            message: "Python\u5B9F\u884C\u74B0\u5883\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093: ".concat(pythonPath),
                        });
                    }
                    // Python実行コア
                    var runPython = function (targetPath, isTemp) {
                        if (isTemp === void 0) { isTemp = false; }
                        console.log("[Transcribe] Executing Python with: ".concat(targetPath));
                        var pythonProcess = (0, child_process_1.spawn)(pythonPath, [
                            scriptPath,
                            targetPath,
                            lyricsText,
                        ]);
                        var stdout = "";
                        var stderr = "";
                        pythonProcess.stdout.on("data", function (data) {
                            stdout += data.toString();
                        });
                        pythonProcess.stderr.on("data", function (data) {
                            stderr += data.toString();
                        });
                        pythonProcess.on("close", function (code) {
                            if (isTemp && fs.existsSync(targetPath)) {
                                fs.unlink(targetPath, function () { });
                            }
                            if (code !== 0) {
                                console.error("[Transcribe] Python Error (code ".concat(code, "): ").concat(stderr));
                                return resolve({
                                    status: "error",
                                    message: "\u30C8\u30E9\u30F3\u30B9\u30AF\u30E9\u30A4\u30D6\u30A8\u30F3\u30B8\u30F3\u306E\u5B9F\u884C\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
                                });
                            }
                            try {
                                var result = JSON.parse(stdout.trim());
                                resolve(result);
                            }
                            catch (e) {
                                console.error("[Transcribe] JSON Parse Error: ".concat(stdout));
                                resolve({
                                    status: "error",
                                    message: "トランスクライブエンジンの出力解析に失敗しました",
                                });
                            }
                        });
                    };
                    // パス判定と処理開始
                    var isUrl = audioPath.startsWith("http://") || audioPath.startsWith("https://");
                    if (isUrl) {
                        console.log("[Transcribe] Remote URL detected. Downloading...");
                        var tempPath_1 = path.join(electron_1.app.getPath("temp"), "badwave_transcribe_".concat(Date.now(), ".mp3"));
                        var file_1 = fs.createWriteStream(tempPath_1);
                        var client = audioPath.startsWith("https") ? https : http;
                        var request = client.get(audioPath, function (response) {
                            if (response.statusCode !== 200) {
                                file_1.close();
                                fs.unlink(tempPath_1, function () { });
                                return resolve({
                                    status: "error",
                                    message: "\u30D5\u30A1\u30A4\u30EB\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F(HTTP ".concat(response.statusCode, ")"),
                                });
                            }
                            response.pipe(file_1);
                            file_1.on("finish", function () {
                                file_1.close(function () { return runPython(tempPath_1, true); });
                            });
                        });
                        request.on("error", function (err) {
                            file_1.close();
                            if (fs.existsSync(tempPath_1))
                                fs.unlink(tempPath_1, function () { });
                            resolve({ status: "error", message: "\u901A\u4FE1\u30A8\u30E9\u30FC: ".concat(err.message) });
                        });
                    }
                    else {
                        console.log("[Transcribe] Local path detected.");
                        runPython(audioPath, false);
                    }
                })];
        });
    }); });
}
//# sourceMappingURL=transcribe.js.map