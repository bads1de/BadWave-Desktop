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
exports.serveLocalFile = serveLocalFile;
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
// メディアファイルのMIMEタイプ
var MIME_TYPES = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".flac": "audio/flac",
    ".aac": "audio/aac",
    ".ogg": "audio/ogg",
    ".opus": "audio/opus",
    ".m4a": "audio/mp4",
    ".wma": "audio/x-ms-wma",
    ".alac": "audio/mp4",
    ".aiff": "audio/aiff",
    ".webm": "audio/webm",
    ".mp4": "video/mp4",
    ".m4v": "video/mp4",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
};
/**
 * ローカルファイルへのリクエストを処理する
 * Rangeリクエスト対応（シーク・メタデータ読み込み用）
 */
function serveLocalFile(request, urlObj) {
    try {
        var encodedPath = urlObj.pathname.slice(1); // 先頭の '/' を削除
        var filePath = decodeURIComponent(encodedPath);
        // ディレクトリトラバーサル対策
        if (filePath.includes("..")) {
            return new Response("Forbidden", { status: 403 });
        }
        // ファイルの存在確認
        if (!fs.existsSync(filePath)) {
            return new Response("Not Found", { status: 404 });
        }
        var stat = fs.statSync(filePath);
        var fileSize = stat.size;
        var ext = path.extname(filePath).toLowerCase();
        var contentType = MIME_TYPES[ext] || "application/octet-stream";
        // Rangeリクエストの処理
        var rangeHeader = request.headers.get("Range");
        if (rangeHeader) {
            var parts = rangeHeader.replace(/bytes=/, "").split("-");
            var start = parseInt(parts[0], 10);
            var end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            var chunkSize = end - start + 1;
            var stream_1 = fs.createReadStream(filePath, { start: start, end: end });
            var readable_1 = new ReadableStream({
                start: function (controller) {
                    stream_1.on("data", function (chunk) { return controller.enqueue(chunk); });
                    stream_1.on("end", function () { return controller.close(); });
                    stream_1.on("error", function (err) { return controller.error(err); });
                },
            });
            return new Response(readable_1, {
                status: 206,
                headers: {
                    "Content-Range": "bytes ".concat(start, "-").concat(end, "/").concat(fileSize),
                    "Accept-Ranges": "bytes",
                    "Content-Length": String(chunkSize),
                    "Content-Type": contentType,
                },
            });
        }
        // 通常のリクエスト
        var stream_2 = fs.createReadStream(filePath);
        var readable = new ReadableStream({
            start: function (controller) {
                stream_2.on("data", function (chunk) { return controller.enqueue(chunk); });
                stream_2.on("end", function () { return controller.close(); });
                stream_2.on("error", function (err) { return controller.error(err); });
            },
        });
        return new Response(readable, {
            status: 200,
            headers: {
                "Content-Length": String(fileSize),
                "Content-Type": contentType,
                "Accept-Ranges": "bytes",
            },
        });
    }
    catch (err) {
        console.error("Local file fetch error:", err);
        return new Response("Not Found", { status: 404 });
    }
}
