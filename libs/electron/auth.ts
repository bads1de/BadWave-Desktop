import { invokeOr } from "./common";

/** 認証キャッシュ（オフラインログイン用） */
export const auth = {
  /** ユーザー情報をローカルに保存 */
  saveCachedUser: (user: {
    id: string;
    email?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean }> =>
    invokeOr({ success: false }, () =>
      window.electron.auth.saveCachedUser(user)
    ),

  /** ローカルに保存されたユーザー情報を取得 */
  getCachedUser: (): Promise<{
    id: string;
    email?: string;
    avatarUrl?: string;
  } | null> =>
    invokeOr(null, () => window.electron.auth.getCachedUser()),

  /** ローカルのユーザー情報をクリア */
  clearCachedUser: (): Promise<{ success: boolean }> =>
    invokeOr({ success: false }, () =>
      window.electron.auth.clearCachedUser()
    ),
};
