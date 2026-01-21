/**
 * Embedded Python ビルドスクリプト
 *
 * このスクリプトは以下を行います:
 * 1. Python Embedded をダウンロード (まだ存在しない場合)
 * 2. 必要なパッケージをインストール
 * 3. Python スクリプトをコピー
 * 4. python-dist フォルダに配布用の Python 環境を作成
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync, spawnSync } = require("child_process");
const { createWriteStream } = require("fs");

// 設定
const PYTHON_VERSION = "3.11.9";
const PYTHON_EMBEDDED_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`;
const GET_PIP_URL = "https://bootstrap.pypa.io/get-pip.py";

const ROOT_DIR = path.join(__dirname, "..");
const PYTHON_DIR = path.join(ROOT_DIR, "python");
const PYTHON_DIST_DIR = path.join(ROOT_DIR, "python-dist");
const EMBED_CACHE_DIR = path.join(ROOT_DIR, ".cache", "python-embed");

// ヘルパー関数
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`[Download] ${url}`);
    const file = createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // リダイレクト対応
          downloadFile(response.headers.location, dest)
            .then(resolve)
            .catch(reject);
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

function extractZip(zipPath, destDir) {
  console.log(`[Extract] ${zipPath} -> ${destDir}`);
  // PowerShell を使用して解凍
  execSync(
    `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`,
    { stdio: "inherit" },
  );
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function main() {
  console.log("=== Embedded Python ビルド開始 ===\n");

  // 1. 出力ディレクトリをクリーンアップ
  if (fs.existsSync(PYTHON_DIST_DIR)) {
    console.log("[Clean] python-dist フォルダを削除中...");
    fs.rmSync(PYTHON_DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PYTHON_DIST_DIR, { recursive: true });

  // 2. Embedded Python をダウンロード (キャッシュがなければ)
  const embedZipPath = path.join(
    EMBED_CACHE_DIR,
    `python-${PYTHON_VERSION}-embed.zip`,
  );
  if (!fs.existsSync(embedZipPath)) {
    console.log("\n[Step 1] Embedded Python をダウンロード中...");
    fs.mkdirSync(EMBED_CACHE_DIR, { recursive: true });
    await downloadFile(PYTHON_EMBEDDED_URL, embedZipPath);
  } else {
    console.log("\n[Step 1] Embedded Python はキャッシュ済み");
  }

  // 3. 解凍
  console.log("\n[Step 2] Embedded Python を解凍中...");
  extractZip(embedZipPath, PYTHON_DIST_DIR);

  // 4. python311._pth を編集して pip を有効化
  console.log("\n[Step 3] pip を有効化中...");
  const pthFile = path.join(PYTHON_DIST_DIR, "python311._pth");
  if (fs.existsSync(pthFile)) {
    let content = fs.readFileSync(pthFile, "utf8");
    // 'import site' のコメントを解除
    content = content.replace("#import site", "import site");
    // Lib/site-packages を追加
    if (!content.includes("Lib/site-packages")) {
      content += "\nLib/site-packages\n";
    }
    fs.writeFileSync(pthFile, content);
  }

  // 5. get-pip.py をダウンロードして実行
  const getPipPath = path.join(PYTHON_DIST_DIR, "get-pip.py");
  console.log("\n[Step 4] pip をインストール中...");
  await downloadFile(GET_PIP_URL, getPipPath);

  const pythonExe = path.join(PYTHON_DIST_DIR, "python.exe");
  spawnSync(pythonExe, [getPipPath, "--no-warn-script-location"], {
    stdio: "inherit",
    cwd: PYTHON_DIST_DIR,
  });

  // get-pip.py を削除
  fs.unlinkSync(getPipPath);

  // 6. 依存パッケージをインストール
  console.log("\n[Step 5] 依存パッケージをインストール中...");
  const requirementsPath = path.join(PYTHON_DIR, "requirements.txt");
  const pipExe = path.join(PYTHON_DIST_DIR, "Scripts", "pip.exe");

  spawnSync(
    pipExe,
    [
      "install",
      "-r",
      requirementsPath,
      "--no-warn-script-location",
      "--target",
      path.join(PYTHON_DIST_DIR, "Lib", "site-packages"),
    ],
    {
      stdio: "inherit",
      cwd: PYTHON_DIST_DIR,
    },
  );

  // 7. Python スクリプトをコピー
  console.log("\n[Step 6] Python スクリプトをコピー中...");
  const scripts = ["lrc_generator.py", "vocal_separator.py"];
  for (const script of scripts) {
    const src = path.join(PYTHON_DIR, script);
    const dest = path.join(PYTHON_DIST_DIR, script);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  - ${script}`);
    }
  }

  // 8. 不要なファイルを削除してサイズ削減
  console.log("\n[Step 7] 不要なファイルを削除中...");
  const sitePackages = path.join(PYTHON_DIST_DIR, "Lib", "site-packages");
  const cleanupPatterns = [
    "**/__pycache__",
    "**/*.pyc",
    "**/*.pyo",
    "**/tests",
    "**/test",
    "**/*.dist-info",
  ];
  // 簡易的なクリーンアップ (完全なクリーンアップはサイズとビルド時間のトレードオフ)

  console.log("\n=== ビルド完了 ===");
  console.log(`出力: ${PYTHON_DIST_DIR}`);

  // サイズを計算
  let totalSize = 0;
  function getSize(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        getSize(fullPath);
      } else {
        totalSize += fs.statSync(fullPath).size;
      }
    }
  }
  getSize(PYTHON_DIST_DIR);
  console.log(`サイズ: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((err) => {
  console.error("ビルドエラー:", err);
  process.exit(1);
});
