import { ipcMain } from "electron";
import type { z } from "zod";
import { validateInput } from "./ipc-validate";

type IpcHandler<Input, Result> = (input: Input) => Promise<Result> | Result;

/**
 * IPC ハンドラの例外をログに残した上で reject する。
 *
 * ハンドラ内で例外を握り潰して空配列や null を返すと、renderer 側で
 * 「データが0件」と「取得に失敗した」が区別できなくなる。
 * そのため、ここでは必ず呼び出し元へエラーを伝播させる。
 */
async function invokeSafely<Result>(
  channel: string,
  run: () => Promise<Result> | Result,
): Promise<Result> {
  try {
    return await run();
  } catch (error) {
    console.error(`[IPC:${channel}] error:`, error);
    throw error;
  }
}

/**
 * 入力検証なしの IPC ハンドラを登録する。
 * 引数を取らないチャンネルや、独自に検証するハンドラで使用する。
 */
export function handleIpc<Result>(
  channel: string,
  handler: IpcHandler<unknown, Result>,
): void {
  ipcMain.handle(channel, (_event, input: unknown) =>
    invokeSafely(channel, () => handler(input)),
  );
}

/**
 * Zod スキーマによる入力検証付きで IPC ハンドラを登録する。
 * 検証失敗も例外として renderer へ伝播する。
 */
export function handleValidatedIpc<Schema extends z.ZodTypeAny, Result>(
  channel: string,
  schema: Schema,
  handler: IpcHandler<z.infer<Schema>, Result>,
): void {
  ipcMain.handle(channel, (_event, input: unknown) =>
    invokeSafely(channel, () => handler(validateInput(schema, input, channel))),
  );
}
