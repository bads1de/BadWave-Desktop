/**
 * メインプロセス内のナビゲーション許可判定
 *
 * `will-navigate` ハンドラなどで、許可する遷移先かどうかを判定する純粋関数。
 * - ローカル開発/スタンドアロンサーバー (http://localhost:*)
 * - カスタムプロトコル (badwave://)
 * - 信頼済み OAuth プロバイダー (Supabase / Google) の https 遷移
 * のみを許可し、それ以外はブロックする。
 */

const TRUSTED_NAV_HOSTS = [
  "supabase.co",
  "supabase.in",
  "accounts.google.com",
];

export function isNavigationAllowed(navigationUrl: string): boolean {
  if (navigationUrl.startsWith("http://localhost:")) return true;
  if (navigationUrl.startsWith("badwave://")) return true;

  try {
    const url = new URL(navigationUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return TRUSTED_NAV_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}
