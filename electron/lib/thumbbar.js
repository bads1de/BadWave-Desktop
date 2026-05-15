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
exports.setupThumbBar = setupThumbBar;
exports.updateThumbBarState = updateThumbBarState;
exports.setupThumbBarHandlers = setupThumbBarHandlers;
var electron_1 = require("electron");
var zlib = __importStar(require("zlib"));
var window_manager_1 = require("./window-manager");
var utils_1 = require("../utils");
// アイコンサイズ
var ICON_SIZE = 16;
// 簡易PNGエンコーダ（main processにはcanvasがないため手動実装）
function encodeSimplePng(width, height, rgbaData) {
    // CRC32テーブル
    var crcTable = [];
    for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[n] = c;
    }
    function crc32(buf) {
        var crc = 0xffffffff;
        for (var i = 0; i < buf.length; i++) {
            crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
        }
        return (crc ^ 0xffffffff) >>> 0;
    }
    function createChunk(type, data) {
        var typeBuffer = Buffer.from(type, "ascii");
        var lengthBuffer = Buffer.alloc(4);
        lengthBuffer.writeUInt32BE(data.length, 0);
        var crcData = Buffer.concat([typeBuffer, data]);
        var crcBuffer = Buffer.alloc(4);
        crcBuffer.writeUInt32BE(crc32(crcData), 0);
        return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
    }
    // PNGシグネチャ
    var signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    // IHDRチャンク
    var ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type: RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace
    // IDAT用のフィルタ付きデータを構築（各行の先頭にfilter byte 0を追加）
    var rawLength = height * (1 + width * 4);
    var rawData = Buffer.alloc(rawLength);
    for (var y = 0; y < height; y++) {
        rawData[y * (1 + width * 4)] = 0; // filter: None
        rgbaData.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
    }
    // zlib圧縮（deflate）
    var compressed = zlib.deflateSync(rawData);
    // PNGチャンクを組み立て
    var chunks = [
        signature,
        createChunk("IHDR", ihdr),
        createChunk("IDAT", compressed),
        createChunk("IEND", Buffer.alloc(0)),
    ];
    return Buffer.concat(chunks);
}
// RGBAピクセルデータからNativeImageを作成
function createIconFromPixels(width, height, draw) {
    var rgba = Buffer.alloc(width * height * 4);
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var _a = draw(x, y), r = _a[0], g = _a[1], b = _a[2], a = _a[3];
            var offset = (y * width + x) * 4;
            rgba[offset] = r;
            rgba[offset + 1] = g;
            rgba[offset + 2] = b;
            rgba[offset + 3] = a;
        }
    }
    var pngBuffer = encodeSimplePng(width, height, rgba);
    return electron_1.nativeImage.createFromBuffer(pngBuffer);
}
// アイコン描画関数
function createPreviousIcon() {
    return createIconFromPixels(ICON_SIZE, ICON_SIZE, function (x, y) {
        // 左矢印: ◁ + 縦線
        // 縦線 (x=13..14, 右側)
        if (x >= 13 && x <= 14 && y >= 2 && y <= 13)
            return [255, 255, 255, 255];
        // 三角 (左向き: 先端x=5, 底辺x=12)
        var tx = x - 5;
        if (tx >= 0 &&
            tx <= 7 &&
            y >= 2 &&
            y <= 13 &&
            tx <= 7 - Math.abs(y - 7.5) * (8 / 11))
            return [255, 255, 255, 255];
        return [0, 0, 0, 0];
    });
}
function createNextIcon() {
    return createIconFromPixels(ICON_SIZE, ICON_SIZE, function (x, y) {
        // 右矢印: ▷ + 縦線
        // 縦線 (x=2..3, 左側)
        if (x >= 2 && x <= 3 && y >= 2 && y <= 13)
            return [255, 255, 255, 255];
        // 三角 (右向き: 底辺x=4, 先端x=11)
        var tx = 11 - x;
        if (tx >= 0 &&
            tx <= 7 &&
            y >= 2 &&
            y <= 13 &&
            tx <= 7 - Math.abs(y - 7.5) * (8 / 11))
            return [255, 255, 255, 255];
        return [0, 0, 0, 0];
    });
}
function createPlayIcon() {
    return createIconFromPixels(ICON_SIZE, ICON_SIZE, function (x, y) {
        // 右向き三角形 ▶
        var cx = 4;
        var halfHeight = 6;
        var maxWidth = 10;
        var relY = y - 7.5;
        var relX = x - cx;
        if (relX >= 0 &&
            relX <= maxWidth &&
            Math.abs(relY) <= halfHeight * (1 - relX / maxWidth))
            return [255, 255, 255, 255];
        return [0, 0, 0, 0];
    });
}
function createPauseIcon() {
    return createIconFromPixels(ICON_SIZE, ICON_SIZE, function (x, y) {
        // 2本の縦線 ‖
        if (y >= 2 && y <= 13) {
            if (x >= 3 && x <= 6)
                return [255, 255, 255, 255];
            if (x >= 9 && x <= 12)
                return [255, 255, 255, 255];
        }
        return [0, 0, 0, 0];
    });
}
// 現在の再生状態
var isPlaying = false;
// サムネイルツールバーのボタンを構築
function buildThumbBarButtons() {
    return [
        {
            tooltip: "前の曲",
            icon: createPreviousIcon(),
            click: function () {
                var mainWindow = (0, window_manager_1.getMainWindow)();
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send("media-control", "previous");
                }
            },
        },
        {
            tooltip: isPlaying ? "一時停止" : "再生",
            icon: isPlaying ? createPauseIcon() : createPlayIcon(),
            click: function () {
                var mainWindow = (0, window_manager_1.getMainWindow)();
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send("media-control", "play-pause");
                }
            },
        },
        {
            tooltip: "次の曲",
            icon: createNextIcon(),
            click: function () {
                var mainWindow = (0, window_manager_1.getMainWindow)();
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send("media-control", "next");
                }
            },
        },
    ];
}
// サムネイルツールバーをセットアップ
function setupThumbBar(win) {
    // Windowsのみ対応
    if (process.platform !== "win32")
        return;
    try {
        win.setThumbarButtons(buildThumbBarButtons());
        (0, utils_1.debugLog)("[ThumbBar] サムネイルツールバーを設定しました");
    }
    catch (error) {
        console.error("[ThumbBar] サムネイルツールバーの設定に失敗:", error);
    }
}
// 再生状態の更新（ボタンアイコンを切り替え）
function updateThumbBarState(playing) {
    if (process.platform !== "win32")
        return;
    isPlaying = playing;
    var mainWindow = (0, window_manager_1.getMainWindow)();
    if (mainWindow && !mainWindow.isDestroyed()) {
        try {
            mainWindow.setThumbarButtons(buildThumbBarButtons());
            (0, utils_1.debugLog)("[ThumbBar] \u72B6\u614B\u66F4\u65B0: ".concat(playing ? "再生中" : "停止中"));
        }
        catch (error) {
            console.error("[ThumbBar] 状態更新に失敗:", error);
        }
    }
}
// IPCハンドラーをセットアップ（rendererからの状態受信）
function setupThumbBarHandlers() {
    electron_1.ipcMain.on("player-state-change", function (_event, state) {
        updateThumbBarState(state.isPlaying);
    });
}
//# sourceMappingURL=thumbbar.js.map