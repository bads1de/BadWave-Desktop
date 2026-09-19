/**
 * electron/preload/index.ts のチャンネル許可リストを
 * electron/channels.ts から自動生成するビルドスクリプト。
 *
 * preload は sandbox 環境で相対モジュールを require できないため、
 * `../channels` を import できず、許可リストをファイル内にインライン保持する必要がある。
 * このスクリプトが「正 (electron/channels.ts)」の定義ブロックをそのまま preload に埋め込む。
 *
 * 使い方: node scripts/generate-preload-channels.mjs
 * (npm run build:electron の先頭で実行される)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const START_MARKER =
  "/* === GENERATED:CHANNELS:START (electron/channels.ts から scripts/generate-preload-channels.mjs が自動生成。手で編集しない) === */";
export const END_MARKER = "/* === GENERATED:CHANNELS:END === */";

const ROOT = path.join(__dirname, "..");
const CHANNELS_SOURCE = path.join(ROOT, "electron", "channels.ts");
const PRELOAD_SOURCE = path.join(ROOT, "electron", "preload", "index.ts");

/** channels.ts の定義ブロック (CHANNELS 〜 SEND_CHANNELS) を抽出する */
export function extractCanonicalBlock(source) {
  const start = source.indexOf("export const CHANNELS = {");
  if (start === -1) throw new Error("CHANNELS の定義が見つかりません");

  const sendDecl = source.indexOf("export const SEND_CHANNELS");
  if (sendDecl === -1) throw new Error("SEND_CHANNELS の定義が見つかりません");

  const semi = source.indexOf(";", sendDecl);
  if (semi === -1) throw new Error("SEND_CHANNELS の終端が見つかりません");

  return source.slice(start, semi + 1);
}

/** preload に埋め込む生成ブロックを組み立てる */
export function buildGeneratedBlock(canonicalBlock) {
  return `${START_MARKER}\n${canonicalBlock}\n${END_MARKER}`;
}

/** preload のソースの生成ブロックを差し替える (マーカー未挿入なら既存定義を置換) */
export function injectGeneratedBlock(preloadSource, generatedBlock) {
  const startIdx = preloadSource.indexOf(START_MARKER);
  const endIdx = preloadSource.indexOf(END_MARKER);

  if (startIdx !== -1 && endIdx !== -1) {
    return (
      preloadSource.slice(0, startIdx) +
      generatedBlock +
      preloadSource.slice(endIdx + END_MARKER.length)
    );
  }

  // まだマーカーがない場合は既存の定義ブロックを置換する
  const existingBlock = extractCanonicalBlock(preloadSource);
  const existingStart = preloadSource.indexOf(existingBlock);
  return (
    preloadSource.slice(0, existingStart) +
    generatedBlock +
    preloadSource.slice(existingStart + existingBlock.length)
  );
}

/** 生成後の preload ソース文字列を返す (書き込みはしない) */
export function generatePreloadSource() {
  const channelsSource = fs.readFileSync(CHANNELS_SOURCE, "utf8");
  const preloadSource = fs.readFileSync(PRELOAD_SOURCE, "utf8");
  const generatedBlock = buildGeneratedBlock(
    extractCanonicalBlock(channelsSource),
  );
  return injectGeneratedBlock(preloadSource, generatedBlock);
}

function main() {
  const before = fs.readFileSync(PRELOAD_SOURCE, "utf8");
  const after = generatePreloadSource();
  if (before === after) {
    console.log("preload channels: 変更なし");
    return;
  }
  fs.writeFileSync(PRELOAD_SOURCE, after);
  console.log("preload channels: 更新しました");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
