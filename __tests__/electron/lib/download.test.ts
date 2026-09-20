import * as fs from "fs";
import * as http from "http";
import * as os from "os";
import * as path from "path";
import { downloadToFile } from "../../../electron/lib/download";

/** リクエストに応答する一時HTTPサーバーを立てる */
function startServer(
  handler: http.RequestListener,
): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ server, port });
    });
  });
}

describe("downloadToFile", () => {
  const createdFiles: string[] = [];

  afterEach(() => {
    for (const file of createdFiles.splice(0)) {
      try {
        fs.unlinkSync(file);
      } catch {
        // 既に削除されている場合は無視
      }
    }
  });

  it("ダウンロードした内容をファイルに書き出す", async () => {
    const body = "hello badwave";
    const { server, port } = await startServer((_req, res) => {
      res.writeHead(200, { "Content-Length": String(body.length) });
      res.end(body);
    });

    const dest = path.join(os.tmpdir(), `badwave-download-test-${Date.now()}.mp3`);
    createdFiles.push(dest);

    try {
      await downloadToFile(`http://127.0.0.1:${port}/song.mp3`, dest);
      expect(fs.readFileSync(dest, "utf-8")).toBe(body);
    } finally {
      server.close();
    }
  });

  it("書き込みに失敗してもクラッシュせず reject する", async () => {
    const { server, port } = await startServer((_req, res) => {
      res.writeHead(200, { "Content-Length": "5" });
      res.end("hello");
    });

    try {
      // 親ディレクトリが存在しないパス → WriteStream が 'error' を発火する
      const dest = path.join(
        os.tmpdir(),
        `badwave-missing-dir-${Date.now()}`,
        "song.mp3",
      );

      await expect(
        downloadToFile(`http://127.0.0.1:${port}/song.mp3`, dest),
      ).rejects.toThrow();
    } finally {
      server.close();
    }
  });

  it("リダイレクトループは上限で打ち切る", async () => {
    const dest = path.join(
      os.tmpdir(),
      `badwave-redirect-test-${Date.now()}.mp3`,
    );
    createdFiles.push(dest);

    let port = 0;
    const started = await startServer((_req, res) => {
      // 自分自身へリダイレクトし続ける
      res.writeHead(302, { Location: `http://127.0.0.1:${port}/loop.mp3` });
      res.end();
    });
    port = started.port;

    try {
      await expect(
        downloadToFile(`http://127.0.0.1:${port}/loop.mp3`, dest),
      ).rejects.toThrow(/Too many redirects/);
    } finally {
      started.server.close();
    }
  });
});
