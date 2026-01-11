export {};

declare global {
  interface Window {
    discord?: {
      setActivity: (activity: any) => Promise<any>;
      clearActivity: () => Promise<void>;
    };
    electron?: {
      ipc: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        on: (channel: string, func: (...args: any[]) => void) => void;
        send: (channel: string, ...args: any[]) => void;
      };
      // 他のプロパティも必要に応じて定義
    };
  }
}
