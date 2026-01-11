# 聴取統計ダッシュボード (Listening Stats) 実装計画

## 概要

ユーザーの聴取習慣を可視化するダッシュボード機能を追加します。
ローカルファーストの原則に従い、再生履歴はまずローカル SQLite データベースに保存・集計されます。

## 実装ステップ

### 1. データベース構築 (Database)

- [ ] **Schema 定義**: `electron/db/schema.ts` に `play_history` テーブルを追加。
  - `id`: UUID (Primary Key)
  - `userId`: ユーザー ID
  - `songId`: 曲 ID (外部キー)
  - `playedAt`: 再生日時
  - `duration`: 再生時間（秒）※今回は簡易的に曲長を使用、将来的に実再生時間に拡張
- [ ] **Migration**: `npx drizzle-kit generate` を実行してマイグレーションファイルを作成。
- [ ] **Apply**: アプリ起動時にマイグレーションが適用されることを確認（既存の仕組みを利用）。

### 2. バックエンド実装 (Electron IPC)

- [ ] **IPC Handler 作成**: `electron/ipc/stats.ts` を新規作成。
  - `record-play`: 履歴を `play_history` テーブルに INSERT する。同時に `songs` テーブルの `playCount`, `lastPlayedAt` も更新する（トランザクション推奨）。
  - `get-listening-stats`: 以下の集計データを返す。
    - `recentPlays`: 直近の再生履歴 (Join songs table)
    - `topSongs`: 再生回数ランキング (期間指定: 全期間/月間)
    - `activityByHour`: 時間帯別の再生回数集計 (0-23 時のヒートマップ用)
- [ ] **Registration**: `electron/main.ts` で `stats.ts` をインポートしてハンドラーを登録。

### 3. フロントエンド・ロジック (Hooks)

- [ ] **IPC 型定義**: `types/index.ts` または `app/local/page.tsx` の型定義を更新し、新しい IPC メソッドを追加。
- [ ] **Log Recording**: `hooks/player/usePlayHistory.ts` を改修。
  - Supabase への直接アクセス (`supabase.from...`) を廃止（または同期ロジックへ移動）。
  - 代わりに `window.electron.ipc.invoke('record-play', ...)` を呼び出す。
  - `useOnPlay.ts` は現状維持（再生開始時に `recordPlay` を呼んでいるため）。※今回は「再生開始」を 1 カウントとする。

### 4. フロントエンド・UI (Dashboard)

- [ ] **Dependencies**: `npm install recharts` を実行。
- [ ] **Page Creation**: `app/stats/page.tsx` を作成。
  - **Header**: タイトルと概要。
  - **Overview Cards**: 総再生回数、今週の再生数など。
  - **Charts**:
    - Recharts を使用した「時間帯別アクティビティ」棒グラフ。
  - **Lists**:
    - 「よく聴く曲 (Top Songs)」リスト。
    - 「最近の再生 (Recent History)」リスト。
- [ ] **Navigation**: サイドバーに「統計 (Stats)」リンクを追加。

## 技術的詳細

### DB Schema (Draft)

```typescript
export const playHistory = sqliteTable("play_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  songId: text("song_id")
    .notNull()
    .references(() => songs.id),
  playedAt: integer("played_at", { mode: "timestamp" }).notNull(),
});
```

### IPC Interface

```typescript
interface StatsApi {
  recordPlay: (songId: string) => Promise<void>;
  getStats: (range: "all" | "month" | "week") => Promise<{
    recent: Song[];
    top: { song: Song; count: number }[];
    hourly: { hour: number; count: number }[];
  }>;
}
```
