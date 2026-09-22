"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { createClient } from "@/libs/supabase/client";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { ROUTES } from "@/constants";

interface UseLogoutOptions {
  /** ログアウト成功時のトーストメッセージ */
  successMessage?: string;
  /** ログアウト後の遷移先。null を指定すると遷移せず現在のルートを再取得する */
  redirectTo?: string | null;
}

/**
 * ログアウト処理を共通化するカスタムフック
 *
 * UserCard / アカウントページで重複していた
 * 「signOut → 遷移 → トースト表示」のパターンをまとめる。
 */
const useLogout = ({
  successMessage = "ログアウトしました",
  redirectTo = ROUTES.HOME,
}: UseLogoutOptions = {}) => {
  const router = useRouter();
  const supabaseClient = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await supabaseClient.auth.signOut();
      toast.success(successMessage);

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch {
      toast.error(ERROR_MESSAGES.LOGOUT_FAILED);
    } finally {
      setIsLoading(false);
    }
  }, [supabaseClient, router, successMessage, redirectTo]);

  return { logout, isLoading };
};

export default useLogout;
