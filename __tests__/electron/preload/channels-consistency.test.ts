/**
 * preload のインライン化されたチャンネル定義が
 * electron/channels.ts と一致することを検証する。
 *
 * preload は sandbox 環境のため相対モジュールを import できず、
 * 許可リストをファイル内にインライン保持している。
 * このテストが「正 (=single source of truth) との差分」を検出する。
 */
import {
  CHANNELS as CANONICAL_CHANNELS,
  INVOKE_CHANNELS as CANONICAL_INVOKE,
  ON_CHANNELS as CANONICAL_ON,
  SEND_CHANNELS as CANONICAL_SEND,
} from "@/electron/channels";
import {
  CHANNELS as PRELOAD_CHANNELS,
  INVOKE_CHANNELS as PRELOAD_INVOKE,
  ON_CHANNELS as PRELOAD_ON,
  SEND_CHANNELS as PRELOAD_SEND,
} from "@/electron/preload/index";

jest.mock("electron", () => ({
  contextBridge: { exposeInMainWorld: jest.fn() },
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    send: jest.fn(),
    removeListener: jest.fn(),
  },
}));

describe("preload IPC channel consistency", () => {
  it("CHANNELS が electron/channels.ts と一致する", () => {
    expect(PRELOAD_CHANNELS).toEqual(CANONICAL_CHANNELS);
  });

  it("INVOKE_CHANNELS が electron/channels.ts と一致する", () => {
    expect(PRELOAD_INVOKE).toEqual(CANONICAL_INVOKE);
  });

  it("ON_CHANNELS が electron/channels.ts と一致する", () => {
    expect(PRELOAD_ON).toEqual(CANONICAL_ON);
  });

  it("SEND_CHANNELS が electron/channels.ts と一致する", () => {
    expect(PRELOAD_SEND).toEqual(CANONICAL_SEND);
  });
});