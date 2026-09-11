import * as fs from "fs";
import * as path from "path";

// メディアファイルのMIMEタイプ
// 注: electron tsconfig の rootDir 制約により constants/ から import できない。
// 拡張子の一覧は constants/ALLOWED_MEDIA_EXTENSIONS が正。変更時はあわせて更新すること
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
  // オフラインDL用画像
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
  // Web Audio / <audio> がカスタムプロトコルを tainted 扱いにしないため
  "Cross-Origin-Resource-Policy": "cross-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
};

function resolveFilePath(urlObj: URL): string {
  // badwave://file/<encoded-path>
  // Chromium は pathname をデコード済みのことがある（C:/Users/... や C:\Users\...）
  let raw = urlObj.pathname.startsWith("/")
    ? urlObj.pathname.slice(1)
    : urlObj.pathname;

  try {
    raw = decodeURIComponent(raw);
  } catch {
    // 既にデコード済み
  }

  // Windows: /C:/Users/... → C:/Users/...
  if (/^\/[A-Za-z]:/.test("/" + raw)) {
    raw = raw.replace(/^\//, "");
  }

  return raw;
}

/**
 * ローカルファイルへのリクエストを処理する
 * Rangeリクエスト対応（シーク・メタデータ読み込み用）
 *
 * Electron 42 以降、Readable.toWeb のストリームは media で不安定なため
 * Buffer で返す（ファイルサイズは曲なので数MB程度）
 */
export function serveLocalFile(request: Request, urlObj: URL): Response {
  try {
    const method = request.method.toUpperCase();
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const filePath = resolveFilePath(urlObj);

    // ディレクトリトラバーサル対策
    const normalizedPath = path.normalize(filePath);
    if (
      filePath.includes("..") ||
      normalizedPath.includes("..") ||
      /(\/|\\)\.\.(\/|\\|$)/.test(filePath) ||
      /(\/|\\)\.\.(\/|\\|$)/.test(normalizedPath)
    ) {
      return new Response("Forbidden", { status: 403, headers: CORS_HEADERS });
    }

    // 拡張子チェック
    const ext = path.extname(filePath).toLowerCase();
    if (!ext || !MIME_TYPES[ext]) {
      return new Response("Forbidden", { status: 403, headers: CORS_HEADERS });
    }

    if (!fs.existsSync(filePath)) {
      return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const contentType = MIME_TYPES[ext];

    const rangeHeader = request.headers.get("Range");
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");

      let start: number;
      let end: number;

      if (parts[0] === "") {
        const suffixLength = parseInt(parts[1], 10);
        end = fileSize - 1;
        start = fileSize - suffixLength;
      } else {
        start = parseInt(parts[0], 10);
        end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      }

      start = Number.isNaN(start)
        ? 0
        : Math.max(0, Math.min(start, fileSize - 1));
      end = Number.isNaN(end)
        ? fileSize - 1
        : Math.max(start, Math.min(end, fileSize - 1));

      const chunkSize = end - start + 1;
      const buf = Buffer.alloc(chunkSize);
      const fd = fs.openSync(filePath, "r");
      try {
        fs.readSync(fd, buf, 0, chunkSize, start);
      } finally {
        fs.closeSync(fd);
      }

      if (method === "HEAD") {
        return new Response(null, {
          status: 206,
          headers: {
            ...CORS_HEADERS,
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunkSize),
            "Content-Type": contentType,
          },
        });
      }

      return new Response(buf, {
        status: 206,
        headers: {
          ...CORS_HEADERS,
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
        },
      });
    }

    const buf = fs.readFileSync(filePath);

    if (method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Length": String(fileSize),
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
        },
      });
    }

    return new Response(buf, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Length": String(fileSize),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      },
    });
  } catch (err) {
    console.error("[badwave] Local file fetch error:", err);
    return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
  }
}
