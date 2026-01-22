# BadWave Desktop

**BadWave Desktop** は、Web の柔軟性とデスクトップのパワーを融合させた、Windows 向けの高性能音楽プレイヤーです。
**Electron** と **Next.js (Renderer)** を組み合わせたハイブリッド構成を採用し、ローカルファーストなデータベース設計と、**Python** と連携した高度な解析機能（歌詞生成など）を搭載しています。

## 🖥 プロジェクトのハイライト

### 1. Electron + Next.js ハイブリッド & IPC 設計

レンダラープロセスに Next.js を採用することで、Web 版と同様のモダンな開発体験を維持しつつ、Electron のメインプロセスと厳密に分離された **IPC (Inter-Process Communication)** ブリッジを通じてネイティブ機能にアクセスします。

- **Context Isolation**: `preload/index.ts` で `contextBridge` を使用し、許可されたチャンネル (`electron.offline`, `electron.discord` 等) のみを Web 側に公開するセキュアな設計です。
- **型安全な通信**: IPC ハンドラーと呼び出し側のインターフェースを厳格に管理しています。

### 2. Python 統合による AI 機能

アプリ内に Python ランタイムを同梱し、Node.js だけでは難しい高度なメディア処理を実現しています。

- **歌詞生成 (LRC Generator)**: `python/lrc_generator.py` を IPC 経由で呼び出し、楽曲のボーカルを解析して同期歌詞ファイル (.lrc) を自動生成します。
- **ボーカル分離**: `python/vocal_separator.py` による Stem 分離機能（実験的機能）。

### 3. デスクトップネイティブ体験

- **Discord RPC**: 再生中の楽曲情報を Discord のステータスにリアルタイム反映します。
- **グローバルショートカット**: アプリがバックグラウンドにあってもキーボードで再生制御が可能。
- **ローカルライブラリ管理**: `better-sqlite3` を使用し、ローカルファイルシステム上の楽曲とメタデータを高速に管理。オフラインでも即座に検索・再生が可能です。

## 🛠 技術スタック

| Category          | Technology                     | Usage                              |
| :---------------- | :----------------------------- | :--------------------------------- |
| **Shell**         | **Electron**                   | デスクトップアプリ基盤             |
| **Renderer**      | **Next.js 15**                 | UI レンダリング、ルーティング      |
| **Database**      | **better-sqlite3**             | 高速な同期型 SQLite ドライバー     |
| **ORM**           | **Drizzle ORM**                | 型安全なスキーマ定義、クエリビルダ |
| **AI/Analysis**   | **Python**                     | 歌詞生成、音声解析バックエンド     |
| **Communication** | **IPC**                        | メイン/レンダラー間通信            |
| **State**         | **Zustand**                    | クライアント状態管理               |
| **Styling**       | **Tailwind CSS**, **Radix UI** | UI コンポーネント                  |
| **Build**         | **electron-builder**           | インストーラー作成、Python同梱処理 |

## 📂 ディレクトリ構造の解説

```bash
badwave-windows/
├── app/                # Next.js App Router (レンダラープロセス)
├── electron/           # Electron メインプロセス
│   ├── ipc/            # IPC ハンドラー (API実装)
│   │   ├── offline.ts  # ダウンロード管理
│   │   ├── discord.ts  # Discord RPC
│   │   └── transcribe.ts # Python連携
│   ├── db/             # ローカルSQLite設定・スキーマ
│   └── preload/        # Preloadスクリプト (Context Bridge)
├── python/             # Python スクリプト (AI/解析)
└── hooks/              # React Hooks (IPC呼び出しラッパー)
```

## 🚀 開発の始め方

### 前提条件

- Node.js (LTS v18+ 推奨)
- Python (ビルド時に必要)
- Windows Build Tools (ネイティブモジュール用)

### インストール手順

1. **リポジトリのクローン:**

   ```bash
   git clone https://github.com/yourusername/badwave-windows.git
   cd badwave-windows
   ```

2. **依存関係のインストール:**

   ```bash
   npm install
   ```

3. **ネイティブモジュールのリビルド:**
   Electron の V8 バージョンに合わせてネイティブモジュール (`better-sqlite3` 等) を再コンパイルします。

   ```bash
   npm run rebuild:electron
   ```

4. **環境変数の設定:**
   `.env.local` に Supabase 等の情報を設定してください。

### 開発・ビルド

- **開発モード起動:**
  Next.js サーバーと Electron を同時に立ち上げます。

  ```bash
  npm run dev:electron
  ```

- **インストーラー作成 (Production Build):**
  Next.js のエクスポート、Electron のコンパイル、Python 環境のバンドルを行い、インストーラー (.exe 等) を生成します。

  ```bash
  npm run dist:electron
  ```

## 🔌 IPC インターフェース

セキュリティのため、レンダラープロセスからは `window.electron` オブジェクトを通じてのみメインプロセス機能へアクセス可能です。

```typescript
// 例: オフライン楽曲の取得
const offlineSongs = await window.electron.offline.getSongs();

// 例: 歌詞生成 (Python連携)
await window.electron.transcribe.generateLrc(audioPath, text);
```
