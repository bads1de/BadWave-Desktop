import * as fs from "fs";
import * as path from "path";

// メディアファイルのMIMEタイプ
const MIME_TYPES: Record<string, string> = {
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
export function serveLocalFile(request: Request, urlObj: URL): Response {
  try {
    const encodedPath = urlObj.pathname.slice(1); // 先頭の '/' を削除
    const filePath = decodeURIComponent(encodedPath);

    // ディレクトリトラバーサル対策
    if (filePath.includes("..")) {
      return new Response("Forbidden", { status: 403 });
    }

    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      return new Response("Not Found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Rangeリクエストの処理
    const rangeHeader = request.headers.get("Range");
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const stream = fs.createReadStream(filePath, { start, end });
      const readable = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk) => controller.enqueue(chunk));
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        },
      });

      return new Response(readable, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
        },
      });
    }

    // 通常のリクエスト
    const stream = fs.createReadStream(filePath);
    const readable = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
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
  } catch (err) {
    console.error("Local file fetch error:", err);
    return new Response("Not Found", { status: 404 });
  }
}
