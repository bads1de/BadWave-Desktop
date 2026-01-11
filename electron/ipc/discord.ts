import { ipcMain } from "electron";
import * as DiscordRPC from "discord-rpc";

const CLIENT_ID = "1459951305647722568";

let rpc: DiscordRPC.Client | null = null;

export const setupDiscordHandlers = () => {
  let loginPromise: Promise<void> | null = null;

  // RPCクライアントの初期化とログイン処理
  const initRpc = async () => {
    if (rpc && loginPromise) return loginPromise;

    rpc = new DiscordRPC.Client({ transport: "ipc" });

    loginPromise = new Promise<void>((resolve, reject) => {
      if (!rpc) return reject("RPC client creation failed");

      rpc.once("ready", () => {
        resolve();
      });

      rpc.login({ clientId: CLIENT_ID }).catch((err) => {
        console.error("Failed to connect to Discord RPC:", err);
        rpc = null;
        loginPromise = null;
        reject(err);
      });
    });

    return loginPromise;
  };

  // アクティビティの更新
  ipcMain.handle(
    "discord:set-activity",
    async (_, activity: DiscordRPC.Presence) => {
      try {
        await initRpc();
      } catch (e) {
        return { success: false, error: "Failed to connect to Discord" };
      }

      if (rpc) {
        try {
          await rpc.setActivity(activity);
          return { success: true };
        } catch (error) {
          console.error("Failed to set activity:", error);
          return { success: false, error };
        }
      } else {
        return { success: false, error: "Discord RPC not initialized" };
      }
    }
  );

  // クリア
  ipcMain.handle("discord:clear-activity", async () => {
    if (rpc) {
      await rpc.clearActivity();
    }
  });

  // 起動時に初期化を試みる（エラーは無視）
  initRpc().catch(() => {});
};
