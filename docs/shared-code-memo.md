# Phase 0: 共通コード（web/desktop/mobile）統合メモ

3環境（badwave / badwave-desktop / badwave-mobile）は同じ系統のコードを
コピーして派生しており、共通部分が重複しつつ drift（乖離）している。
このファイルは統合・整理の進捗と知見を記録する。

## 背景（調査で判明した事実）

- web↔desktop は同一パスのソースファイルが **164個**（テスト除く）存在
- うち **14個はバイト単位で完全一致**
- ただし中核ロジックは既に drift している:
  - `constants/errorMessages.ts` — 38行(web) / 78行(desktop) / 66行(mobile)
  - `hooks/audio/useAudioPlayer.ts` — web↔desktop で追加158/削除150行（ほぼ別物）
  - `components/Sidebar/Sidebar.tsx` — 追加60/削除155行
  - Zustand ストア — 永続化層が別物（desktop=localStorage / mobile=MMKV）
- そもそもフレームワークが違う（web: React19 / **desktop: React18** / mobile: React19）
  → 共有できるのは「フレームワーク非依存の純粋ロジック」のみ

## 統合の基本方針

- 闇雲に統合しない。**1ファイルずつ中身を読んで統合可否を判断**する
- 同じパスでも中身は2種類ある:
  1. **完全一致で統合できる**（純粋関数・フレームワーク非依存ロジック）
  2. **環境ごとに drift していて統合が危険**（値・構造が違うもの）
- 安易な統合は「同じキーを叩いても環境で挙動が変わるバグ」を生む

## 対応済み

### 1. `libs/utils/error.ts`（getErrorMessage）

- 状態: **3環境で実装が完全に同一**（統合候補）
- desktop の構造は理想的: `electron/lib/error.ts` が**唯一の真実**で、
  レンダラー側 `libs/utils/error.ts` は**再エクスポートのみ**
  （electron → libs の一方向依存。`electron/constants.ts` と同じ共有パターン）
- 対応: `electron/lib/error.ts`（真実側）に「3環境で完全に同一。変更時は
  3環境すべてに同じ差分を適用すること」という注記を追加（drift 防止の意識付け）
- 検証: renderer/electron 両方の tsc PASS、実コード差分ゼロ

### 2. `constants/errorMessages.ts`（ERROR_MESSAGES）

- 状態: **統合は見送り**（環境ごとにキー名・値が異なる）
  - 値が異なる例: `TITLE_REQUIRED` は mobile「プレイリスト名を…」（desktop は「タイトルを…」）
  - キー名が異なる例: `LOGOUT_FAILED`(web/desktop) と `SIGNOUT_FAILED`(mobile)
  - desktop 独自キーも多数（Electron/オフライン/ローカル曲関連）
- 対応: 各環境に「環境ごとにキー名・値が異なる。統合・変更時は3環境すべてで
  差分を確認すること」という注意喚起コメントを追加（drift の可視化）
- 検証: tsc PASS、実コード差分ゼロ

### 3. `constants/colorSchemes.ts`（テーマ定義）

- 状態: **web↔desktop は「DEFAULT 以外完全一致」= 統合候補、mobile は統合不可**
  - 機械比較の結果、差分は `DEFAULT_COLOR_SCHEME_ID` の1行のみ（web="violet" / desktop="cyberpunk"）
  - 当該差は**意図的**（各環境のテストで値を固定: desktop=`__tests__/constants/colorSchemes.test.ts`）
  - mobile の対応物は `constants/ThemeColors.ts` — 5テーマ・別キー構造で統合不可
- 対応: web/desktop の冒頭に「共通部分は完全に同一・差分は意図的な DEFAULT のみ」の注記、
  `DEFAULT_COLOR_SCHEME_ID` 行にも意図差の注記を追加
- 検証: 定数テスト desktop 33 / web 25 件 PASS、renderer tsc PASS、実コード差分ゼロ

### 4. `constants/index.ts`（純粋定数）

- 状態: **ファイル全体では統合不可。定数単位で選別可能**:
  - 3環境同一: `CACHE_PREFIX`（"@query-cache"）/ `CACHE_CONFIG.staleTime`（10分）
  - web=desktop 完全一致: `videoIds` / `genres`
  - 意図的な差: `CACHE_CONFIG.gcTime`（web/desktop=30分 / mobile=7日）
  - 上位集合: `CACHED_QUERIES`（本環境 = web + 5キー。共通15キーは値まで一致）/
    `TABLES`（本環境 = web + `PLAY_HISTORY`）
  - 別体系: mobile の `CACHED_QUERIES` / `SUPABASE_TABLES`（キー命名が異なる）
  - 環境固有: `PROTECTED_ROUTES` / `DURATIONS`（web/desktop は秒・mobile は
    `ANIMATION_DURATION` ミリ秒）/ `SPRING_*` / `ROUTES`
- 知見: web の `PROTECTED_ROUTES` は `"/playlist"`（単数）で、実ルート `"/playlists"` を
  `startsWith` の prefix 一致で偶然カバーしている。本環境は `"/playlists"` を保護しない（→ 5 で判断記録）
- 対応: 3環境の `constants/index.ts` 冒頭に定数単位の drift マップ注記を追加
- 検証: 定数テスト desktop 33 / web 25 / mobile 62 件 + renderer tsc PASS。実コード差分ゼロ

### 5. プレイリストページの未認証時挙動（判断のみ・コード変更なし）

- 経緯: web 側の `PROTECTED_ROUTES` 整理（"/playlist" → "/playlists"）に伴い本環境の扱いを確認
- 判断: 本環境は `middleware.ts` の matcher が `/account/:path*` / `/liked/:path*` のみで、
  `/playlists` では middleware 自体が実行されない。未認証時は `useGetPlaylists` の
  `enabled: !!user?.id` により空状態を表示する local-first 設計のため、**変更しない**
- 検証: コード変更なし（テスト影響なし）

## 次の候補（未着手）

- web↔desktop のバイト一致ファイルの棚卸し: 件数が計測方法で揺れる（初版 14 個 / 再計測 11 個）。
  スクリプトを固定して再計測し、統合候補リストを確定させる
- 将来的に `@badwave/shared` パッケージを作り、真実を1箇所に集約する
  （desktop 内の `electron/lib/error.ts` → `libs/utils/error.ts` パターンを横展開する形）

## 原則

- **「モノレポ化」と「共通化」は同時にやらない。**
  先に drift を解消してから、モノレポの器に載せるのが安全。
- desktop は React18 で web は React19 のため、完全な単一依存にはならない点に注意。
- 変更は「コメントのみ・挙動を変えない」安全パターンを徹底し、都度 tsc/テストで検証する。
