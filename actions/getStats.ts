"use server";

import { createClient } from "@/libs/supabase/server";
import type { StatsPeriod, UserStats } from "@/types/stats";

export type { StatsPeriod, UserStats } from "@/types/stats";

/**
 * ユーザーの聴取統計を取得する
 * @param period - 集計期間 ("week" | "month" | "all")
 * @returns 統計データ
 */
export async function getListeningStats(
  period: StatsPeriod = "week"
): Promise<UserStats | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("認証エラー:", authError?.message);
    return null;
  }

  // 期間に応じた開始日を計算
  const now = new Date();
  let periodStart: Date;

  switch (period) {
    case "week":
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "all":
    default:
      // 十分に過去の日付（10年前）
      periodStart = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
      break;
  }

  const { data, error } = await supabase.rpc("get_user_stats", {
    target_user_id: user.id,
    period_start: periodStart.toISOString(),
    user_timezone: "Asia/Tokyo", // タイムゾーンを指定して正確な時間帯集計を行う
  });

  if (error) {
    console.error("統計データの取得に失敗しました:", error.message);
    return null;
  }

  return data as UserStats;
}
