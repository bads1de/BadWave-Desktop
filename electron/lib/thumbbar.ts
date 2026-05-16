import { BrowserWindow, ipcMain, nativeImage, NativeImage } from "electron";
import * as zlib from "zlib";
import { getMainWindow } from "./window-manager";
import { debugLog } from "../utils";

// アイコンサイズ
const ICON_SIZE = 16;

// 簡易PNGエンコーダ（main processにはcanvasがないため手動実装）
function encodeSimplePng(
  width: number,
  height: number,
  rgbaData: Buffer,
): Buffer {
  // CRC32テーブル
  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function createChunk(type: string, data: Buffer): Buffer {
    const typeBuffer = Buffer.from(type, "ascii");
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(data.length, 0);

    const crcData = Buffer.concat([typeBuffer, data]);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc32(crcData), 0);

    return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
  }

  // PNGシグネチャ
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDRチャンク
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT用のフィルタ付きデータを構築（各行の先頭にfilter byte 0を追加）
  const rawLength = height * (1 + width * 4);
  const rawData = Buffer.alloc(rawLength);
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: None
    rgbaData.copy(
      rawData,
      y * (1 + width * 4) + 1,
      y * width * 4,
      (y + 1) * width * 4,
    );
  }

  // zlib圧縮（deflate）
  const compressed = zlib.deflateSync(rawData);

  // PNGチャンクを組み立て
  const chunks = [
    signature,
    createChunk("IHDR", ihdr),
    createChunk("IDAT", compressed),
    createChunk("IEND", Buffer.alloc(0)),
  ];

  return Buffer.concat(chunks);
}

// RGBAピクセルデータからNativeImageを作成
function createIconFromPixels(
  width: number,
  height: number,
  draw: (x: number, y: number) => [number, number, number, number],
): NativeImage {
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = draw(x, y);
      const offset = (y * width + x) * 4;
      rgba[offset] = r;
      rgba[offset + 1] = g;
      rgba[offset + 2] = b;
      rgba[offset + 3] = a;
    }
  }

  const pngBuffer = encodeSimplePng(width, height, rgba);
  return nativeImage.createFromBuffer(pngBuffer);
}

// アイコン描画関数
function createPreviousIcon(): NativeImage {
  return createIconFromPixels(ICON_SIZE, ICON_SIZE, (x, y) => {
    // 左矢印: ◁ + 縦線
    // 縦線 (x=13..14, 右側)
    if (x >= 13 && x <= 14 && y >= 2 && y <= 13) return [255, 255, 255, 255];
    // 三角 (左向き: 先端x=5, 底辺x=12)
    const tx = x - 5;
    if (
      tx >= 0 &&
      tx <= 7 &&
      y >= 2 &&
      y <= 13 &&
      tx <= 7 - Math.abs(y - 7.5) * (8 / 11)
    )
      return [255, 255, 255, 255];
    return [0, 0, 0, 0];
  });
}

function createNextIcon(): NativeImage {
  return createIconFromPixels(ICON_SIZE, ICON_SIZE, (x, y) => {
    // 右矢印: ▷ + 縦線
    // 縦線 (x=2..3, 左側)
    if (x >= 2 && x <= 3 && y >= 2 && y <= 13) return [255, 255, 255, 255];
    // 三角 (右向き: 底辺x=4, 先端x=11)
    const tx = 11 - x;
    if (
      tx >= 0 &&
      tx <= 7 &&
      y >= 2 &&
      y <= 13 &&
      tx <= 7 - Math.abs(y - 7.5) * (8 / 11)
    )
      return [255, 255, 255, 255];
    return [0, 0, 0, 0];
  });
}

function createPlayIcon(): NativeImage {
  return createIconFromPixels(ICON_SIZE, ICON_SIZE, (x, y) => {
    // 右向き三角形 ▶
    const cx = 4;
    const halfHeight = 6;
    const maxWidth = 10;
    const relY = y - 7.5;
    const relX = x - cx;
    if (
      relX >= 0 &&
      relX <= maxWidth &&
      Math.abs(relY) <= halfHeight * (1 - relX / maxWidth)
    )
      return [255, 255, 255, 255];
    return [0, 0, 0, 0];
  });
}

function createPauseIcon(): NativeImage {
  return createIconFromPixels(ICON_SIZE, ICON_SIZE, (x, y) => {
    // 2本の縦線 ‖
    if (y >= 2 && y <= 13) {
      if (x >= 3 && x <= 6) return [255, 255, 255, 255];
      if (x >= 9 && x <= 12) return [255, 255, 255, 255];
    }
    return [0, 0, 0, 0];
  });
}

// 現在の再生状態
let isPlaying = false;

// サムネイルツールバーのボタンを構築
function buildThumbBarButtons(): Electron.ThumbarButton[] {
  return [
    {
      tooltip: "前の曲",
      icon: createPreviousIcon(),
      click: () => {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("media-control", "previous");
        }
      },
    },
    {
      tooltip: isPlaying ? "一時停止" : "再生",
      icon: isPlaying ? createPauseIcon() : createPlayIcon(),
      click: () => {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("media-control", "play-pause");
        }
      },
    },
    {
      tooltip: "次の曲",
      icon: createNextIcon(),
      click: () => {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("media-control", "next");
        }
      },
    },
  ];
}

// サムネイルツールバーをセットアップ
export function setupThumbBar(win: BrowserWindow) {
  // Windowsのみ対応
  if (process.platform !== "win32") return;

  try {
    win.setThumbarButtons(buildThumbBarButtons());
    debugLog("[ThumbBar] サムネイルツールバーを設定しました");
  } catch (error) {
    console.error("[ThumbBar] サムネイルツールバーの設定に失敗:", error);
  }
}

// 再生状態の更新（ボタンアイコンを切り替え）
export function updateThumbBarState(playing: boolean) {
  if (process.platform !== "win32") return;

  isPlaying = playing;

  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.setThumbarButtons(buildThumbBarButtons());
    } catch (error) {
      console.error("[ThumbBar] 状態更新に失敗:", error);
    }
  }
}

// IPCハンドラーをセットアップ（rendererからの状態受信）
export function setupThumbBarHandlers() {
  ipcMain.on("player-state-change", (_event, state: { isPlaying: boolean }) => {
    updateThumbBarState(state.isPlaying);
  });
}
