import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { app } from "electron";
import path from "path";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const getDb = () => {
  if (dbInstance) return dbInstance;

  // メインプロセス内であることを確認
  if (!app) {
    throw new Error(
      "Local Database can only be initialized in the Electron Main process."
    );
  }

  const dbPath = path.join(app.getPath("userData"), "badwave_offline.db");

  // SQLiteインスタンスの初期化
  // verboseを有効にすると、デバッグ用にクエリログが出力されます
  const sqlite = new Database(dbPath);

  // WALモード有効化: 同時読み込みと書き込みの性能向上、IPC応答のブロッキング軽減
  sqlite.pragma("journal_mode = WAL");
  // 外部キー制約を有効化 (Drizzleのリレーション整合性)
  sqlite.pragma("foreign_keys = ON");
  // 同期レベルをNORMALに: WALモードでの推奨設定 (FULLの約10倍高速)
  sqlite.pragma("synchronous = NORMAL");

  // Drizzleの初期化
  dbInstance = drizzle(sqlite, { schema });
  return dbInstance;
};
