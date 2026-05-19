"use strict";
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
function setupSyncHandlers() {
    var _this = this;
    var db = (0, client_1.getDb)();
    /**
     * 楽曲メタデータを内部でupsertする
     */
    function internalSyncSongs(songsData) {
        return __awaiter(this, void 0, void 0, function () {
            var count, _loop_1, _i, songsData_1, song;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        count = 0;
                        _loop_1 = function (song) {
                            var songId, existing, record;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0:
                                        songId = (0, utils_1.normalizeId)(song.id);
                                        return [4 /*yield*/, db.query.songs.findFirst({
                                                where: function (songs, _a) {
                                                    var eq = _a.eq;
                                                    return eq(songs.id, songId);
                                                },
                                                columns: {
                                                    songPath: true,
                                                    imagePath: true,
                                                    videoPath: true,
                                                    downloadedAt: true,
                                                },
                                            })];
                                    case 1:
                                        existing = _f.sent();
                                        record = {
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
                                        return [4 /*yield*/, db
                                                .insert(schema_1.songs)
                                                .values(record)
                                                .onConflictDoUpdate({
                                                target: schema_1.songs.id,
                                                set: {
                                                    title: record.title,
                                                    author: record.author,
                                                    originalSongPath: record.originalSongPath,
                                                    originalImagePath: record.originalImagePath,
                                                    originalVideoPath: record.originalVideoPath,
                                                    duration: record.duration,
                                                    genre: record.genre,
                                                    lyrics: record.lyrics,
                                                    playCount: record.playCount,
                                                    likeCount: record.likeCount,
                                                    createdAt: record.createdAt,
                                                },
                                            })];
                                    case 2:
                                        _f.sent();
                                        count++;
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, songsData_1 = songsData;
                        _e.label = 1;
                    case 1:
                        if (!(_i < songsData_1.length)) return [3 /*break*/, 4];
                        song = songsData_1[_i];
                        return [5 /*yield**/, _loop_1(song)];
                    case 2:
                        _e.sent();
                        _e.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, count];
                }
            });
        });
    }
    electron_1.ipcMain.handle("sync-songs-metadata", function (_, data) { return __awaiter(_this, void 0, void 0, function () {
        var count, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, internalSyncSongs(data)];
                case 1:
                    count = _a.sent();
                    return [2 /*return*/, { success: true, count: count }];
                case 2:
                    error_1 = _a.sent();
                    return [2 /*return*/, { success: false, error: error_1.message }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("sync-playlists", function (_, data) { return __awaiter(_this, void 0, void 0, function () {
        var _i, data_1, item, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    _i = 0, data_1 = data;
                    _a.label = 1;
                case 1:
                    if (!(_i < data_1.length)) return [3 /*break*/, 4];
                    item = data_1[_i];
                    return [4 /*yield*/, db
                            .insert(schema_1.playlists)
                            .values({
                            id: (0, utils_1.normalizeId)(item.id),
                            userId: String(item.user_id),
                            title: String(item.title),
                            imagePath: item.image_path,
                            isPublic: Boolean(item.is_public),
                            createdAt: item.createdAt || item.created_at,
                        })
                            .onConflictDoUpdate({
                            target: schema_1.playlists.id,
                            set: {
                                title: String(item.title),
                                imagePath: item.image_path,
                                isPublic: Boolean(item.is_public),
                            },
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, { success: true, count: data.length }];
                case 5:
                    error_2 = _a.sent();
                    return [2 /*return*/, { success: false, error: error_2.message }];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("sync-playlist-songs", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var _i, fullSongsData_1, songData, songId, psId, error_3;
        var playlistId = _b.playlistId, fullSongsData = _b.songs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, internalSyncSongs(fullSongsData)];
                case 1:
                    _c.sent();
                    _i = 0, fullSongsData_1 = fullSongsData;
                    _c.label = 2;
                case 2:
                    if (!(_i < fullSongsData_1.length)) return [3 /*break*/, 5];
                    songData = fullSongsData_1[_i];
                    songId = (0, utils_1.normalizeId)(songData.id);
                    psId = "".concat(playlistId, "_").concat(songId);
                    return [4 /*yield*/, db
                            .insert(schema_1.playlistSongs)
                            .values({
                            id: psId,
                            playlistId: (0, utils_1.normalizeId)(playlistId),
                            songId: songId,
                            addedAt: songData.created_at,
                        })
                            .onConflictDoNothing()];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, { success: true }];
                case 6:
                    error_3 = _c.sent();
                    return [2 /*return*/, { success: false, error: error_3.message }];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("sync-liked-songs", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var _i, fullSongsData_2, songData, error_4;
        var userId = _b.userId, fullSongsData = _b.songs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, internalSyncSongs(fullSongsData)];
                case 1:
                    _c.sent();
                    _i = 0, fullSongsData_2 = fullSongsData;
                    _c.label = 2;
                case 2:
                    if (!(_i < fullSongsData_2.length)) return [3 /*break*/, 5];
                    songData = fullSongsData_2[_i];
                    return [4 /*yield*/, db
                            .insert(schema_1.likedSongs)
                            .values({
                            userId: String(userId),
                            songId: (0, utils_1.normalizeId)(songData.id),
                            likedAt: songData.created_at || new Date().toISOString(),
                        })
                            .onConflictDoNothing()];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, { success: true }];
                case 6:
                    error_4 = _c.sent();
                    console.error("[Sync] Liked Songs Error:", error_4);
                    return [2 /*return*/, { success: false, error: error_4.message }];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("sync-spotlights-metadata", function (_, data) { return __awaiter(_this, void 0, void 0, function () {
        var count, _i, data_2, item, id, record, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    count = 0;
                    _i = 0, data_2 = data;
                    _a.label = 1;
                case 1:
                    if (!(_i < data_2.length)) return [3 /*break*/, 4];
                    item = data_2[_i];
                    id = (0, utils_1.normalizeId)(item.id);
                    record = {
                        id: id,
                        title: String(item.title || "Unknown Title"),
                        author: String(item.author || "Unknown Author"),
                        description: item.description,
                        genre: item.genre,
                        originalVideoPath: item.video_path,
                        originalThumbnailPath: item.thumbnail_path,
                        createdAt: item.created_at,
                    };
                    return [4 /*yield*/, db
                            .insert(schema_1.spotlights)
                            .values(record)
                            .onConflictDoUpdate({
                            target: schema_1.spotlights.id,
                            set: {
                                title: record.title,
                                author: record.author,
                                description: record.description,
                                genre: record.genre,
                                originalVideoPath: record.originalVideoPath,
                                originalThumbnailPath: record.originalThumbnailPath,
                                createdAt: record.createdAt,
                            },
                        })];
                case 2:
                    _a.sent();
                    count++;
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, { success: true, count: count }];
                case 5:
                    error_5 = _a.sent();
                    return [2 /*return*/, { success: false, error: error_5.message }];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("sync-section", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var itemIds, error_6;
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
                    error_6 = _c.sent();
                    console.error("[Sync] Section ".concat(key, " Error:"), error_6);
                    return [2 /*return*/, { success: false, error: error_6.message }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
//# sourceMappingURL=sync.js.map