"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.setupSyncHandlers = setupSyncHandlers;
var electron_1 = require("electron");
var client_1 = require("../db/client");
var schema_1 = require("../db/schema");
var utils_1 = require("../utils");
var drizzle_orm_1 = require("drizzle-orm");
// SQLiteのバインド変数上限 (SQLITE_MAX_VARIABLE_NUMBER) を考慮したバッチサイズ
// songs: 17カラム → 999 / 17 ≈ 58曲/batch
var BATCH_SIZE = 50;
function setupSyncHandlers() {
    var _this = this;
    var db = (0, client_1.getDb)();
    /**
     * 楽曲メタデータをバルクupsertする
     *
     * 既存レコードを1クエリでプリフェッチし、downloaded fields (songPath, imagePath, videoPath, downloadedAt)
     * を保持したままバルクINSERTする。SQLite変数制限(999)を超えないようバッチ分割する。
     */
    function internalSyncSongs(songsData) {
        if (songsData.length === 0)
            return 0;
        var ids = songsData.map(function (song) { return (0, utils_1.normalizeId)(song.id); });
        // 1. 既存レコードのdownloaded fieldsをバッチでプリフェッチ
        var existingMap = new Map();
        for (var i = 0; i < ids.length; i += BATCH_SIZE) {
            var batchIds = ids.slice(i, i + BATCH_SIZE);
            var rows = db
                .select({
                id: schema_1.songs.id,
                songPath: schema_1.songs.songPath,
                imagePath: schema_1.songs.imagePath,
                videoPath: schema_1.songs.videoPath,
                downloadedAt: schema_1.songs.downloadedAt,
            })
                .from(schema_1.songs)
                .where((0, drizzle_orm_1.inArray)(schema_1.songs.id, batchIds))
                .all();
            for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                var row = rows_1[_i];
                existingMap.set(row.id, row);
            }
        }
        // 2. 全レコードを構築（downloaded fieldsは既存値を保持）
        var records = songsData.map(function (song) {
            var _a, _b, _c, _d;
            var songId = (0, utils_1.normalizeId)(song.id);
            var existing = existingMap.get(songId);
            return {
                id: songId,
                userId: String(song.user_id || ""),
                title: String(song.title || "Unknown Title"),
                author: String(song.author || "Unknown Author"),
                songPath: (_a = existing === null || existing === void 0 ? void 0 : existing.songPath) !== null && _a !== void 0 ? _a : null,
                imagePath: (_b = existing === null || existing === void 0 ? void 0 : existing.imagePath) !== null && _b !== void 0 ? _b : null,
                videoPath: (_c = existing === null || existing === void 0 ? void 0 : existing.videoPath) !== null && _c !== void 0 ? _c : null,
                originalSongPath: song.song_path,
                originalImagePath: song.image_path,
                originalVideoPath: song.video_path,
                duration: song.duration ? Number(song.duration) : null,
                genre: song.genre,
                lyrics: song.lyrics,
                playCount: song.count ? Number(song.count) : 0,
                likeCount: song.like_count ? Number(song.like_count) : 0,
                createdAt: song.created_at,
                downloadedAt: (_d = existing === null || existing === void 0 ? void 0 : existing.downloadedAt) !== null && _d !== void 0 ? _d : null,
            };
        });
        // 3. バルクUPSERT（バッチ分割して変数制限を回避）
        for (var i = 0; i < records.length; i += BATCH_SIZE) {
            var batch = records.slice(i, i + BATCH_SIZE);
            db.insert(schema_1.songs)
                .values(batch)
                .onConflictDoUpdate({
                target: schema_1.songs.id,
                set: {
                    title: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["excluded.title"], ["excluded.title"]))),
                    author: (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["excluded.author"], ["excluded.author"]))),
                    originalSongPath: (0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["excluded.original_song_path"], ["excluded.original_song_path"]))),
                    originalImagePath: (0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["excluded.original_image_path"], ["excluded.original_image_path"]))),
                    originalVideoPath: (0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["excluded.original_video_path"], ["excluded.original_video_path"]))),
                    duration: (0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["excluded.duration"], ["excluded.duration"]))),
                    genre: (0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["excluded.genre"], ["excluded.genre"]))),
                    lyrics: (0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["excluded.lyrics"], ["excluded.lyrics"]))),
                    playCount: (0, drizzle_orm_1.sql)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["excluded.play_count"], ["excluded.play_count"]))),
                    likeCount: (0, drizzle_orm_1.sql)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["excluded.like_count"], ["excluded.like_count"]))),
                    createdAt: (0, drizzle_orm_1.sql)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["excluded.created_at"], ["excluded.created_at"]))),
                },
            })
                .run();
        }
        return songsData.length;
    }
    electron_1.ipcMain.handle("sync-songs-metadata", function (_, data) { return __awaiter(_this, void 0, void 0, function () {
        var count;
        return __generator(this, function (_a) {
            try {
                count = internalSyncSongs(data);
                return [2 /*return*/, { success: true, count: count }];
            }
            catch (error) {
                return [2 /*return*/, { success: false, error: error.message }];
            }
            return [2 /*return*/];
        });
    }); });
    electron_1.ipcMain.handle("sync-playlists", function (_, data) { return __awaiter(_this, void 0, void 0, function () {
        var records;
        return __generator(this, function (_a) {
            try {
                if (data.length === 0)
                    return [2 /*return*/, { success: true, count: 0 }];
                records = data.map(function (item) { return ({
                    id: (0, utils_1.normalizeId)(item.id),
                    userId: String(item.user_id),
                    title: String(item.title),
                    imagePath: item.image_path,
                    isPublic: Boolean(item.is_public),
                    createdAt: item.createdAt || item.created_at,
                }); });
                db.insert(schema_1.playlists)
                    .values(records)
                    .onConflictDoUpdate({
                    target: schema_1.playlists.id,
                    set: {
                        title: (0, drizzle_orm_1.sql)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["excluded.title"], ["excluded.title"]))),
                        imagePath: (0, drizzle_orm_1.sql)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["excluded.image_path"], ["excluded.image_path"]))),
                        isPublic: (0, drizzle_orm_1.sql)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["excluded.is_public"], ["excluded.is_public"]))),
                    },
                })
                    .run();
                return [2 /*return*/, { success: true, count: data.length }];
            }
            catch (error) {
                return [2 /*return*/, { success: false, error: error.message }];
            }
            return [2 /*return*/];
        });
    }); });
    electron_1.ipcMain.handle("sync-playlist-songs", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var playlistId = _b.playlistId, fullSongsData = _b.songs;
        return __generator(this, function (_c) {
            try {
                db.transaction(function () {
                    internalSyncSongs(fullSongsData);
                    var joinRecords = fullSongsData.map(function (songData) { return ({
                        id: "".concat(playlistId, "_").concat((0, utils_1.normalizeId)(songData.id)),
                        playlistId: (0, utils_1.normalizeId)(playlistId),
                        songId: (0, utils_1.normalizeId)(songData.id),
                        addedAt: songData.created_at,
                    }); });
                    db.insert(schema_1.playlistSongs)
                        .values(joinRecords)
                        .onConflictDoNothing()
                        .run();
                });
                return [2 /*return*/, { success: true }];
            }
            catch (error) {
                return [2 /*return*/, { success: false, error: error.message }];
            }
            return [2 /*return*/];
        });
    }); });
    electron_1.ipcMain.handle("sync-liked-songs", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var userId = _b.userId, fullSongsData = _b.songs;
        return __generator(this, function (_c) {
            try {
                db.transaction(function () {
                    internalSyncSongs(fullSongsData);
                    var joinRecords = fullSongsData.map(function (songData) { return ({
                        userId: String(userId),
                        songId: (0, utils_1.normalizeId)(songData.id),
                        likedAt: songData.created_at || new Date().toISOString(),
                    }); });
                    db.insert(schema_1.likedSongs)
                        .values(joinRecords)
                        .onConflictDoNothing()
                        .run();
                });
                return [2 /*return*/, { success: true }];
            }
            catch (error) {
                console.error("[Sync] Liked Songs Error:", error);
                return [2 /*return*/, { success: false, error: error.message }];
            }
            return [2 /*return*/];
        });
    }); });
    electron_1.ipcMain.handle("sync-spotlights-metadata", function (_, data) { return __awaiter(_this, void 0, void 0, function () {
        var ids, existingMap_1, i, batchIds, rows, _i, rows_2, row, records, i, batch;
        return __generator(this, function (_a) {
            try {
                if (data.length === 0)
                    return [2 /*return*/, { success: true, count: 0 }];
                ids = data.map(function (item) { return (0, utils_1.normalizeId)(item.id); });
                existingMap_1 = new Map();
                for (i = 0; i < ids.length; i += BATCH_SIZE) {
                    batchIds = ids.slice(i, i + BATCH_SIZE);
                    rows = db
                        .select({
                        id: schema_1.spotlights.id,
                        videoPath: schema_1.spotlights.videoPath,
                        thumbnailPath: schema_1.spotlights.thumbnailPath,
                        downloadedAt: schema_1.spotlights.downloadedAt,
                    })
                        .from(schema_1.spotlights)
                        .where((0, drizzle_orm_1.inArray)(schema_1.spotlights.id, batchIds))
                        .all();
                    for (_i = 0, rows_2 = rows; _i < rows_2.length; _i++) {
                        row = rows_2[_i];
                        existingMap_1.set(row.id, row);
                    }
                }
                records = data.map(function (item) {
                    var _a, _b, _c;
                    var id = (0, utils_1.normalizeId)(item.id);
                    var existing = existingMap_1.get(id);
                    return {
                        id: id,
                        title: String(item.title || "Unknown Title"),
                        author: String(item.author || "Unknown Author"),
                        description: item.description,
                        genre: item.genre,
                        originalVideoPath: item.video_path,
                        originalThumbnailPath: item.thumbnail_path,
                        createdAt: item.created_at,
                        videoPath: (_a = existing === null || existing === void 0 ? void 0 : existing.videoPath) !== null && _a !== void 0 ? _a : null,
                        thumbnailPath: (_b = existing === null || existing === void 0 ? void 0 : existing.thumbnailPath) !== null && _b !== void 0 ? _b : null,
                        downloadedAt: (_c = existing === null || existing === void 0 ? void 0 : existing.downloadedAt) !== null && _c !== void 0 ? _c : null,
                    };
                });
                // バッチ分割してバルクUPSERT
                for (i = 0; i < records.length; i += BATCH_SIZE) {
                    batch = records.slice(i, i + BATCH_SIZE);
                    db.insert(schema_1.spotlights)
                        .values(batch)
                        .onConflictDoUpdate({
                        target: schema_1.spotlights.id,
                        set: {
                            title: (0, drizzle_orm_1.sql)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["excluded.title"], ["excluded.title"]))),
                            author: (0, drizzle_orm_1.sql)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["excluded.author"], ["excluded.author"]))),
                            description: (0, drizzle_orm_1.sql)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["excluded.description"], ["excluded.description"]))),
                            genre: (0, drizzle_orm_1.sql)(templateObject_18 || (templateObject_18 = __makeTemplateObject(["excluded.genre"], ["excluded.genre"]))),
                            originalVideoPath: (0, drizzle_orm_1.sql)(templateObject_19 || (templateObject_19 = __makeTemplateObject(["excluded.original_video_path"], ["excluded.original_video_path"]))),
                            originalThumbnailPath: (0, drizzle_orm_1.sql)(templateObject_20 || (templateObject_20 = __makeTemplateObject(["excluded.original_thumbnail_path"], ["excluded.original_thumbnail_path"]))),
                            createdAt: (0, drizzle_orm_1.sql)(templateObject_21 || (templateObject_21 = __makeTemplateObject(["excluded.created_at"], ["excluded.created_at"]))),
                        },
                    })
                        .run();
                }
                return [2 /*return*/, { success: true, count: data.length }];
            }
            catch (error) {
                return [2 /*return*/, { success: false, error: error.message }];
            }
            return [2 /*return*/];
        });
    }); });
    electron_1.ipcMain.handle("sync-section", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var itemIds, error_1;
        var key = _b.key, data = _b.data;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    itemIds = data.map(function (item) { return (0, utils_1.normalizeId)(item.id); });
                    return [4 /*yield*/, db
                            .insert(schema_1.sectionCache)
                            .values({
                            key: key,
                            itemIds: itemIds,
                            updatedAt: new Date(),
                        })
                            .onConflictDoUpdate({
                            target: schema_1.sectionCache.key,
                            set: {
                                itemIds: itemIds,
                                updatedAt: new Date(),
                            },
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, { success: true, count: itemIds.length }];
                case 2:
                    error_1 = _c.sent();
                    console.error("[Sync] Section ".concat(key, " Error:"), error_1);
                    return [2 /*return*/, { success: false, error: error_1.message }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21;
//# sourceMappingURL=sync.js.map