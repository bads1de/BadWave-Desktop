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
exports.setupQueryHandlers = setupQueryHandlers;
var electron_1 = require("electron");
var client_1 = require("../db/client");
var schema_1 = require("../db/schema");
var drizzle_orm_1 = require("drizzle-orm");
var utils_1 = require("../utils");
function setupQueryHandlers() {
    var _this = this;
    var db = (0, client_1.getDb)();
    electron_1.ipcMain.handle("get-cached-liked-songs", function (_, userId) { return __awaiter(_this, void 0, void 0, function () {
        var results, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select()
                            .from(schema_1.likedSongs)
                            .leftJoin(schema_1.songs, (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["CAST(", " AS TEXT) = CAST(", " AS TEXT)"], ["CAST(", " AS TEXT) = CAST(", " AS TEXT)"])), schema_1.likedSongs.songId, schema_1.songs.id))
                            .where((0, drizzle_orm_1.eq)(schema_1.likedSongs.userId, String(userId)))];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results.map(function (row) {
                            var liked_songs = row.liked_songs;
                            var song = row.songs;
                            if (!song) {
                                return (0, utils_1.createUnknownSongFallback)(liked_songs.songId, liked_songs.userId, liked_songs.likedAt);
                            }
                            return (0, utils_1.mapDbSongToResponse)(song, {
                                created_at: liked_songs.likedAt,
                                user_id: liked_songs.userId,
                            });
                        })];
                case 2:
                    error_1 = _a.sent();
                    console.error("[IPC] get-cached-liked-songs error:", error_1);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("get-cached-playlists", function (_, userId) { return __awaiter(_this, void 0, void 0, function () {
        var data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.query.playlists.findMany({
                            where: (0, drizzle_orm_1.eq)(schema_1.playlists.userId, String(userId)),
                        })];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.map(function (item) { return ({
                            id: item.id,
                            user_id: item.userId,
                            title: item.title,
                            image_path: item.imagePath,
                            is_public: item.isPublic,
                            created_at: item.createdAt,
                        }); })];
                case 2:
                    error_2 = _a.sent();
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("get-cached-playlist-songs", function (_, playlistId) { return __awaiter(_this, void 0, void 0, function () {
        var results, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select()
                            .from(schema_1.playlistSongs)
                            .leftJoin(schema_1.songs, (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["CAST(", " AS TEXT) = CAST(", " AS TEXT)"], ["CAST(", " AS TEXT) = CAST(", " AS TEXT)"])), schema_1.playlistSongs.songId, schema_1.songs.id))
                            .where((0, drizzle_orm_1.eq)(schema_1.playlistSongs.playlistId, (0, utils_1.normalizeId)(playlistId)))];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results.map(function (row) {
                            var playlist_songs = row.playlist_songs;
                            var song = row.songs;
                            if (!song) {
                                return (0, utils_1.createUnknownSongFallback)(playlist_songs.songId, "", playlist_songs.addedAt);
                            }
                            return (0, utils_1.mapDbSongToResponse)(song, {
                                created_at: playlist_songs.addedAt,
                            });
                        })];
                case 2:
                    error_3 = _a.sent();
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("get-section-data", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var cache, itemIds, results, idMap_1, error_4;
        var key = _b.key, type = _b.type;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 8, , 9]);
                    return [4 /*yield*/, db.query.sectionCache.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.sectionCache.key, key),
                        })];
                case 1:
                    cache = _c.sent();
                    if (!cache || !cache.itemIds) {
                        return [2 /*return*/, []];
                    }
                    itemIds = cache.itemIds;
                    if (itemIds.length === 0)
                        return [2 /*return*/, []];
                    results = [];
                    idMap_1 = new Map();
                    if (!(type === "spotlights")) return [3 /*break*/, 3];
                    return [4 /*yield*/, db
                            .select()
                            .from(schema_1.spotlights)
                            .where((0, drizzle_orm_1.inArray)(schema_1.spotlights.id, itemIds))];
                case 2:
                    results = _c.sent();
                    results.forEach(function (item) {
                        return idMap_1.set(item.id, {
                            id: item.id,
                            title: item.title,
                            author: item.author,
                            description: item.description,
                            genre: item.genre,
                            video_path: item.originalVideoPath,
                            thumbnail_path: item.originalThumbnailPath,
                            local_video_path: item.videoPath || null,
                            local_thumbnail_path: item.thumbnailPath || null,
                            created_at: item.createdAt,
                        });
                    });
                    return [3 /*break*/, 7];
                case 3:
                    if (!(type === "playlists")) return [3 /*break*/, 5];
                    return [4 /*yield*/, db
                            .select()
                            .from(schema_1.playlists)
                            .where((0, drizzle_orm_1.inArray)(schema_1.playlists.id, itemIds))];
                case 4:
                    results = _c.sent();
                    results.forEach(function (p) {
                        return idMap_1.set(p.id, {
                            id: p.id,
                            user_id: p.userId,
                            title: p.title,
                            image_path: p.imagePath,
                            is_public: !!p.isPublic,
                            created_at: p.createdAt,
                        });
                    });
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, db
                        .select()
                        .from(schema_1.songs)
                        .where((0, drizzle_orm_1.inArray)(schema_1.songs.id, itemIds))];
                case 6:
                    results = _c.sent();
                    results.forEach(function (s) {
                        return idMap_1.set(s.id, (0, utils_1.mapDbSongToResponse)(s));
                    });
                    _c.label = 7;
                case 7: return [2 /*return*/, itemIds
                        .map(function (id) { return idMap_1.get(id); })
                        .filter(function (item) { return item !== undefined; })];
                case 8:
                    error_4 = _c.sent();
                    console.error("[IPC] get-section-data(".concat(key, ") error:"), error_4);
                    return [2 /*return*/, []];
                case 9: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("get-songs-paginated", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var results, error_5;
        var offset = _b.offset, limit = _b.limit;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select()
                            .from(schema_1.songs)
                            .orderBy((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " DESC"], ["", " DESC"])), schema_1.songs.createdAt))
                            .limit(limit)
                            .offset(offset)];
                case 1:
                    results = _c.sent();
                    return [2 /*return*/, results.map(function (s) { return (0, utils_1.mapDbSongToResponse)(s); })];
                case 2:
                    error_5 = _c.sent();
                    console.error("[IPC] get-songs-paginated error:", error_5);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("get-songs-total-count", function () { return __awaiter(_this, void 0, void 0, function () {
        var result, error_6;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select({ count: (0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                            .from(schema_1.songs)];
                case 1:
                    result = _b.sent();
                    return [2 /*return*/, ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) || 0];
                case 2:
                    error_6 = _b.sent();
                    console.error("[IPC] get-songs-total-count error:", error_6);
                    return [2 /*return*/, 0];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("debug-dump-db", function () { return __awaiter(_this, void 0, void 0, function () {
        var liked, allSongs, joined, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, db.select().from(schema_1.likedSongs).limit(10)];
                case 1:
                    liked = _a.sent();
                    return [4 /*yield*/, db.select().from(schema_1.songs).limit(10)];
                case 2:
                    allSongs = _a.sent();
                    return [4 /*yield*/, db
                            .select()
                            .from(schema_1.likedSongs)
                            .leftJoin(schema_1.songs, (0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["CAST(", " AS TEXT) = CAST(", " AS TEXT)"], ["CAST(", " AS TEXT) = CAST(", " AS TEXT)"])), schema_1.likedSongs.songId, schema_1.songs.id))
                            .limit(10)];
                case 3:
                    joined = _a.sent();
                    return [2 /*return*/, { liked: liked, allSongs: allSongs, joined: joined }];
                case 4:
                    error_7 = _a.sent();
                    return [2 /*return*/, { error: error_7.message }];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("get-song-by-id", function (_, songId) { return __awaiter(_this, void 0, void 0, function () {
        var normalizedId, song, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    normalizedId = (0, utils_1.normalizeId)(songId);
                    return [4 /*yield*/, db.query.songs.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.songs.id, normalizedId),
                        })];
                case 1:
                    song = _a.sent();
                    if (!song) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, (0, utils_1.mapDbSongToResponse)(song)];
                case 2:
                    error_8 = _a.sent();
                    console.error("[IPC] get-song-by-id(".concat(songId, ") error:"), error_8);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("get-playlist-by-id", function (_, playlistId) { return __awaiter(_this, void 0, void 0, function () {
        var normalizedId, playlist, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    normalizedId = (0, utils_1.normalizeId)(playlistId);
                    return [4 /*yield*/, db.query.playlists.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.playlists.id, normalizedId),
                        })];
                case 1:
                    playlist = _a.sent();
                    if (!playlist) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, {
                            id: playlist.id,
                            user_id: playlist.userId,
                            title: playlist.title,
                            image_path: playlist.imagePath || undefined,
                            is_public: !!playlist.isPublic,
                            created_at: playlist.createdAt,
                        }];
                case 2:
                    error_9 = _a.sent();
                    console.error("[IPC] get-playlist-by-id(".concat(playlistId, ") error:"), error_9);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
//# sourceMappingURL=queries.js.map