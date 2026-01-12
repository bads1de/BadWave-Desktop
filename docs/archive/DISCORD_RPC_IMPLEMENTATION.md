# Discord Rich Presence 実装ガイド

このドキュメントでは、`badwave-windows` (Electron 版) に Discord Rich Presence (DRPC) を実装する手順を解説します。
DRPC を導入することで、Discord のユーザープロフィール上に「BadWave で楽曲を再生中」といったステータスを表示できます。

## 1. 準備

### Discord Developer Portal での設定

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセスします。
2. **New Application** を作成し、名前を `BadWave` にします。
3. **Application ID (Client ID)** をコピーしておきます。
4. **Rich Presence > Art Assets** から、アセット（ロゴ画像など）をアップロードします。
   - `logo_large`: メインのロゴ画像
   - `play_icon`: 再生中アイコン
   - `pause_icon`: 一時停止アイコン

## 2. 依存関係のインストール

プロジェクトルートで以下のコマンドを実行します。

```bash
npm install discord-rpc
npm install --save-dev @types/discord-rpc
```

## 3. コードの実装

### A. メインプロセス: IPC ハンドラー作成

`electron/ipc/discord.ts` を作成します。

```typescript
import { ipcMain } from "electron";
import * as DiscordRPC from "discord-rpc";

const CLIENT_ID = "1459951305647722568"; // 取得したIDに置き換え
let rpc: DiscordRPC.Client | null = null;

export const setupDiscordHandlers = () => {
  const initRpc = () => {
    if (rpc) return;
    rpc = new DiscordRPC.Client({ transport: "ipc" });

    rpc.on("ready", () => {
      console.log("Discord RPC Connected");
    });

    rpc.login({ clientId: CLIENT_ID }).catch(console.error);
  };

  ipcMain.handle(
    "discord:set-activity",
    async (_, activity: DiscordRPC.Presence) => {
      if (!rpc) initRpc();
      if (rpc) {
        try {
          await rpc.setActivity(activity);
          return { success: true };
        } catch (error) {
          return { success: false, error };
        }
      }
    }
  );

  ipcMain.handle("discord:clear-activity", async () => {
    if (rpc) {
      await rpc.clearActivity();
    }
  });

  initRpc();
};
```

### B. メインプロセス: ハンドラーの登録

`electron/main.ts` で上記関数を呼び出します。

```typescript
import { setupDiscordHandlers } from "./ipc/discord";

// app.whenReady().then(...) 内で実行
setupDiscordHandlers();
```

### C. プリロードスクリプト

`electron/preload/index.ts` に API を追加します。

```typescript
contextBridge.exposeInMainWorld("discord", {
  setActivity: (activity: any) =>
    ipcRenderer.invoke("discord:set-activity", activity),
  clearActivity: () => ipcRenderer.invoke("discord:clear-activity"),
});
```

### D. 型定義の追加

`types/window.d.ts` (または適切な .d.ts ファイル) に型を追加します。

```typescript
interface Window {
  discord: {
    setActivity: (activity: any) => Promise<any>;
    clearActivity: () => Promise<void>;
  };
}
```

### E. フロントエンド: カスタムフック

`hooks/utils/useDiscordRpc.ts` を作成します。

```typescript
import { useEffect } from "react";
import { usePlaybackStateStore } from "@/hooks/stores/usePlaybackStateStore";

export const useDiscordRpc = () => {
  const { currentSong, isPlaying } = usePlaybackStateStore();

  useEffect(() => {
    const updateActivity = async () => {
      if (!window.discord) return;

      if (!currentSong) {
        await window.discord.clearActivity();
        return;
      }

      await window.discord.setActivity({
        details: currentSong.title,
        state: `by ${currentSong.author}`,
        largeImageKey: "logo_large",
        largeImageText: "BadWave",
        smallImageKey: isPlaying ? "play_icon" : "pause_icon",
        smallImageText: isPlaying ? "Playing" : "Paused",
        instance: false,
        // 再生中のみ開始時間を表示して「00:01経過」のように出す
        startTimestamp: isPlaying ? Date.now() : undefined,
      });
    };

    updateActivity();
  }, [currentSong, isPlaying]);
};
```

### F. アプリへの組み込み

`app/layout.tsx` (または `providers/DiscordProvider.tsx` を作って) フックを呼び出します。

```tsx
"use client";
import { useDiscordRpc } from "@/hooks/utils/useDiscordRpc";

export function DiscordManager() {
  useDiscordRpc();
  return null;
}

// Layout.tsx の中の適当な場所（Providers内）に <DiscordManager /> を配置
```

## 4. 注意点

- **再生位置の同期**: `position` を依存配列に入れると 1 秒ごとに IPC 通信が発生し負荷がかかるため、曲が変わった時や再生状態が変わった時のみ更新するのが一般的です。
- **エラーハンドリング**: Discord が起動していない場合、`rpc.login` が失敗します。リトライロジックを入れるとより堅牢になります。
