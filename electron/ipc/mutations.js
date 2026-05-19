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
exports.setupMutationHandlers = setupMutationHandlers;
var electron_1 = require("electron");
var client_1 = require("../db/client");
var schema_1 = require("../db/schema");
var drizzle_orm_1 = require("drizzle-orm");
var utils_1 = require("../utils");
function setupMutationHandlers() {
    var _this = this;
    var db = (0, client_1.getDb)();
    electron_1.ipcMain.handle("add-liked-song", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var error_1;
        var userId = _b.userId, songId = _b.songId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .insert(schema_1.likedSongs)
                            .values({
                            userId: String(userId),
                            songId: (0, utils_1.normalizeId)(songId),
                            likedAt: new Date().toISOString(),
                        })
                            .onConflictDoNothing()];
                case 1:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
                case 2:
                    error_1 = _c.sent();
                    console.error("[IPC] add-liked-song error:", error_1);
                    return [2 /*return*/, { success: false, error: error_1.message }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("remove-liked-song", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var error_2;
        var userId = _b.userId, songId = _b.songId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .delete(schema_1.likedSongs)
                            .where((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " = ", " AND ", " = ", ""], ["", " = ", " AND ", " = ", ""])), schema_1.likedSongs.userId, String(userId), schema_1.likedSongs.songId, (0, utils_1.normalizeId)(songId)))];
                case 1:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
                case 2:
                    error_2 = _c.sent();
                    console.error("[IPC] remove-liked-song error:", error_2);
                    return [2 /*return*/, { success: false, error: error_2.message }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("get-like-status", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var result, error_3;
        var userId = _b.userId, songId = _b.songId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.query.likedSongs.findFirst({
                            where: (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " = ", " AND ", " = ", ""], ["", " = ", " AND ", " = ", ""])), schema_1.likedSongs.userId, String(userId), schema_1.likedSongs.songId, (0, utils_1.normalizeId)(songId)),
                        })];
                case 1:
                    result = _c.sent();
                    return [2 /*return*/, { isLiked: !!result }];
                case 2:
                    error_3 = _c.sent();
                    console.error("[IPC] get-like-status error:", error_3);
                    return [2 /*return*/, { isLiked: false, error: error_3.message }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("add-playlist-song", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var psId, error_4;
        var playlistId = _b.playlistId, songId = _b.songId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    psId = "".concat((0, utils_1.normalizeId)(playlistId), "_").concat((0, utils_1.normalizeId)(songId));
                    return [4 /*yield*/, db
                            .insert(schema_1.playlistSongs)
                            .values({
                            id: psId,
                            playlistId: (0, utils_1.normalizeId)(playlistId),
                            songId: (0, utils_1.normalizeId)(songId),
                            addedAt: new Date().toISOString(),
                        })
                            .onConflictDoNothing()];
                case 1:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
                case 2:
                    error_4 = _c.sent();
                    console.error("[IPC] add-playlist-song error:", error_4);
                    return [2 /*return*/, { success: false, error: error_4.message }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    electron_1.ipcMain.handle("remove-playlist-song", function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
        var error_5;
        var playlistId = _b.playlistId, songId = _b.songId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .delete(schema_1.playlistSongs)
                            .where((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " = ", " AND ", " = ", ""], ["", " = ", " AND ", " = ", ""])), schema_1.playlistSongs.playlistId, (0, utils_1.normalizeId)(playlistId), schema_1.playlistSongs.songId, (0, utils_1.normalizeId)(songId)))];
                case 1:
                    _c.sent();
                    return [2 /*return*/, { success: true }];
                case 2:
                    error_5 = _c.sent();
                    console.error("[IPC] remove-playlist-song error:", error_5);
                    return [2 /*return*/, { success: false, error: error_5.message }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
var templateObject_1, templateObject_2, templateObject_3;
//# sourceMappingURL=mutations.js.map