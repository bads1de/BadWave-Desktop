# BadWave Desktop (badwave-windows)

## 概要

`../badwave`（Web 版）に Electron メインプロセス・ローカル SQLite・同梱 Python を追加したデスクトップ版。UI 層は Web 版と同じ構成（Next.js 15 App Router、Tailwind、Zustand、React Query、Supabase、`@/` エイリアス）。

## レイヤー構造

```text
badwave-windows/
├── app/                  # Next.js App Router（レンダラー UI・ルート）
│   ├── (site)/ account/ genre/ liked/ playlists/ pulse/ search/ songs/
│   └── local/ offline/   # デスクトップ専用ページ（ローカル楽曲・オフライン）
├── actions/              # Server Actions（checkAdmin / getStats / r2）
├── components/           # UI（player/ sidebar/ modals/ common/ ui ほか）
├── hooks/                # React hooks + Zustand ストア
│   ├── data/             #   React Query 用データ取得 hooks
│   ├── stores/           #   Zustand ストア
│   └── player/ audio/ downloads/ modal/ sync/ ...
├── libs/                 # レンダラー側ライブラリ
│   ├── electron/         #   IPC 呼び出しラッパー（auth/ cache/ offline/ files/ ...）
│   ├── supabase/ query/ audio/ utils/
│   └── admin.ts s3.ts songUtils.ts ...
├── providers/            # React Context プロバイダー（Theme/ Toaster/ Sync ほか）
├── types/                # 共有型定義（index / local / stats）
├── __tests__/            # Jest テスト（* .test.ts = electron-main / *.test.tsx = dom）
│
├── electron/             # Electron メインプロセス（TS ソース。下記参照）
├── drizzle/              # SQLite マイグレーション SQL（drizzle-kit 生成）
├── python/               # 同梱 Python スクリプト + requirements.txt
├── python-dist/          # Embedded Python 3.11.9（build-python 生成物、gitignore 済み）
├── scripts/              # build-python.js / test-electron.js / create-icons.js
├── docs/                 # アーカイブのみ
└── dist/                 # electron-builder 成果物（gitignore 済み）
```

### electron/（メインプロセス）

```text
electron/
├── main.ts               # エントリポイント。IPC ハンドラー・OAuth・DB マイグレーションを登録
├── channels.ts           # IPC チャンネル名の一元管理（定数。値の重複・変更を防止）
├── electron-env.d.ts     # window.electron の型（ElectronAPI）とグローバル宣言
├── tsconfig.json         # tsc -p electron 用（outDir "." でその場に .js を出力）
├── preload/index.ts      # contextBridge で window.electron を公開
├── ipc/                  # IPC ハンドラー（auth/ dialog/ discord/ download/ library/
│                         #   mini-player/ mutations/ offline/ queries/ settings/ sync/
│                         #   transcribe/ window）
├── db/                   # client.ts（better-sqlite3 + Drizzle, WAL）/ schema.ts / migrate.ts
├── lib/                  # protocol / oauth-server / window-manager / server（本番は
│                         #   .next/standalone を起動）/ tray / thumbbar / ipc-validate ほか
├── shortcuts/ utils/ static/
```

### IPC の流れ

`components/hooks` → `libs/electron/*`（ラッパー）→ `window.electron`（`preload/index.ts` の contextBridge）→ チャンネル定数 `channels.ts` → `electron/ipc/*` ハンドラー → ローカル DB / OS 機能

### その他

- ローカル DB: `electron/db/client.ts`（better-sqlite3 + Drizzle、`userData/badwave_offline.db`、WAL）。マイグレーションは `drizzle/` を起動時に自動適用（`electron/db/migrate.ts`）。スキーマ変更時は `npx drizzle-kit generate` で SQL を生成
- `python/` — 同梱スクリプト（`lrc_generator.py` 歌詞生成、`vocal_separator.py` ボーカル分離）。`python-dist/` は `npm run build:python` で生成

## 設計思想

- **Local-first（オフライン優先）**: オンライン時は Supabase が正、Electron ではローカル SQLite を常に優先して読む。同期（`electron/ipc/sync.ts` のバックアップ upsert + `hooks/sync/` のフック）がキャッシュを最新化する。`hooks/data/` の各フックは `libs/query/useSectionQuery.ts` に「Electronキャッシュ → Web」の二又取得を集約した薄いラッパーなので、**新規データフックもこのヘルパーを使う**（`queryKey` と `webFn` だけ渡す）。`networkMode: "always"` でオフライン時も SQLite から読める
- **IPC は型安全・一元管理**: チャンネル名は `electron/channels.ts` の定数のみ使用（重複・変更防止）。レンダラーは `window.electron`（`electron-env.d.ts` の ElectronAPI 型）経由のみで、preload の contextBridge が最小 API だけ公開。IPC 入力は `electron/lib/ipc-validate.ts` の Zod スキーマで検証（パストラバーサル・危険 URL を排除）
- **データモデル**: `electron/db/schema.ts` の `songs` は Supabase の UUID を PK にし、ローカルパス（`songPath` 等）と元のリモート URL（`originalSongPath` 等）を分離。`songPath` が null = メタデータのみ・未ダウンロード
- **再生はカスタムプロトコル**: `electron/lib/protocol.ts` が `badwave://` スキームでローカルファイルを配信（CSP bypass・stream 対応）
- **Python は重いメディア処理専任**: LRC 生成・ボーカル分離を同梱 Python に委譲。Node 側は `electron/ipc/transcribe.ts` でプロセス起動するだけ

## コマンド

- `npm run dev` — ブラウザのみ（Electron なし）
- `npm run dev:electron` — デスクトップ起動（`build:electron` を先行実行し :3000 を待つ）
- `npm run build:electron` — `tsc -p electron` で `electron/` の `.ts` を**その場に** `.js` コンパイル（出力は gitignore 済み）。`electron/` を変更したら必ず再実行
- npm install / node_modules 変更後: `npm run rebuild:electron`（better-sqlite3 を Electron 用にリビルド。Web 用は `rebuild:node`）
- `npm run dist:electron` — インストーラー生成（next build → electron → python ビルド（python.org からダウンロード、要ネットワーク）→ electron-builder）。時間がかかるので頻繁に実行しない
- `npm run lint` — next lint

## テスト

- jest は拡張子で 2 プロジェクトに分かれる（`jest.config.js`）:
  - `*.test.ts` → `@kayahr/jest-electron-runner/main`（Electron メインプロセス内で実行）
  - `*.test.tsx` → jsdom
- `npm test` で両方実行。絞り込み: `npx jest <path> --selectProjects dom`（または `electron-main`）
- `__tests__/setup.ts` が `window.electron`・`@supabase/ssr`・`matchMedia`・`ResizeObserver` を自動モック。DB 系テストは `electron` モジュールがモックされる前提で書く
- `npm run test:electron` — アプリ起動スモークテスト。事前に `npm run build:electron` が必要

## 落とし穴

- `electron/` 内の `.js` / `.js.map` はコンパイル生成物。直接編集・コミットしない
- `electron-esbuild.config.js` は未使用（ビルドは tsc）。`docs/` はアーカイブのみ、`dist/` はビルド成果物
- `.env.local` はコミット済み（Supabase 等）。新しい env ファイルを作成・コミットしない
- コメント・README・コミットメッセージは日本語。CI は未設定
