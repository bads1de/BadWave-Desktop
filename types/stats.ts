// 聴取統計関連の型定義

export type StatsPeriod = "week" | "month" | "all";

export interface HourlyActivity {
  hour: number;
  count: number;
}

export interface WeeklyActivity {
  day_of_week: number; // 0=日曜, 1=月曜, ... 6=土曜
  count: number;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface GenreStat {
  genre: string;
  count: number;
}

export interface TopSong {
  id: string;
  title: string;
  author: string;
  image_path: string;
  genre?: string;
  play_count: number;
}

export interface RecentPlay {
  id: string;
  title: string;
  author: string;
  image_path: string;
  played_at: string;
}

export interface UserStats {
  recent_plays: RecentPlay[] | null;
  hourly_activity: HourlyActivity[] | null;
  weekly_activity: WeeklyActivity[] | null;
  daily_activity: DailyActivity[] | null;
  top_songs: TopSong[] | null;
  genre_stats: GenreStat[] | null;
  streak: number | null;
}
