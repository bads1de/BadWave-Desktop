"use client";

import { useState, useEffect } from "react";

// データ取得フック
import useGetRecommendations from "@/hooks/data/useGetRecommendations";
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";
import useGetSpotlight from "@/hooks/data/useGetSpotlight";
import useGetSongs from "@/hooks/data/useGetSongs";
import useGetPublicPlaylists from "@/hooks/data/useGetPublicPlaylists";

// 背景同期フック
import { useSyncTrends } from "@/hooks/sync/useSyncTrends";
import { useSyncSpotlight } from "@/hooks/sync/useSyncSpotlight";
import { useSyncLatestSongs } from "@/hooks/sync/useSyncLatestSongs";
import { useSyncRecommendations } from "@/hooks/sync/useSyncRecommendations";
import { useSyncPublicPlaylists } from "@/hooks/sync/useSyncPublicPlaylists";

// セクションコンポーネント
import TrendSection from "@/components/Home/TrendSection";
import SpotlightSection from "@/components/Home/SpotlightSection";
import LatestReleasesSection from "@/components/Home/LatestSection";
import ForYouSection from "@/components/Home/ForYouSection";
import PlaylistsSection from "@/components/Home/PlaylistsSection";
import GenreSection from "@/components/Home/GenreSection";
import SectionSkeleton from "@/components/Home/SectionSkeleton";

import Header from "@/components/Header/Header";

/**
 * ホームページ
 *
 * 全てのデータをクライアントサイドフックで取得します。
 * TanStack Query と Electron Store による永続化キャッシュにより、
 * オフライン時や起動時にローカルデータを即座に表示します。
 */
export default function Home() {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "all" | "month" | "week" | "day"
  >("all");

  // Hydrationエラーを防ぐため、マウント状態を管理
  // 初期レンダリング（サーバー＆クライアントハイドレーション）時はスケルトンを表示し、
  // マウント後にデータがあれば表示に切り替えることで不一致を防ぐ
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 各セクションのデータをクライアントサイドでフェッチ（キャッシュ優先）
  const { trends, isLoading: trendsLoading } = useGetTrendSongs(selectedPeriod);
  const { spotlightData, isLoading: spotlightLoading } = useGetSpotlight();
  const { songs: latestSongs, isLoading: latestLoading } = useGetSongs();
  const { playlists: publicPlaylists, isLoading: playlistsLoading } =
    useGetPublicPlaylists();
  const { recommendations, isLoading: recommendationsLoading } =
    useGetRecommendations();

  // 背景同期の実行 (Electron環境下でのみ動作)
  useSyncTrends(selectedPeriod);
  useSyncSpotlight();
  useSyncLatestSongs();
  useSyncRecommendations();
  useSyncPublicPlaylists();

  return (
    <div className="flex h-full overflow-hidden font-mono bg-[#0a0a0f] relative">
      {/* 背景装飾 */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
      
      <div className="w-full h-full overflow-y-auto custom-scrollbar relative z-10">
        <Header className="sticky top-0 z-20">
          <div className="flex items-center justify-between w-full px-4 lg:px-8 py-2">
            <div className="flex flex-col">
              <h1 className="text-4xl font-black tracking-[0.2em] text-white uppercase cyber-glitch">
                BADWAVE_MAIN_NET
              </h1>
              <div className="flex items-center gap-4 text-[8px] text-theme-500/60 uppercase tracking-[0.3em] font-mono mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                  STATUS: ONLINE
                </span>
                <span>// SECTOR: HOME</span>
                <span className="hidden sm:inline">// NODE: 0x8F2D</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 font-mono">
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-theme-500/40 uppercase tracking-widest">System_Uptime</span>
                <span className="text-xs text-theme-300 font-bold tabular-nums">124:45:02</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-theme-500/40 uppercase tracking-widest">Network_Traffic</span>
                <span className="text-xs text-theme-300 font-bold tabular-nums">42.8 GB/s</span>
              </div>
              <div className="flex flex-col items-end border-l border-theme-500/10 pl-8">
                <span className="text-[8px] text-theme-500/40 uppercase tracking-widest">Security_Level</span>
                <span className="text-xs text-theme-500 font-black">STABLE</span>
              </div>
            </div>
          </div>
        </Header>

        {/* 背景装飾 */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
        
        <main className="relative px-6 py-12 pb-24 space-y-24 max-w-7xl mx-auto">
          {/* トレンドボードセクション */}
          {!isMounted || (trendsLoading && trends.length === 0) ? (
            <SectionSkeleton title="Trends" type="trend" />
          ) : (
            <TrendSection
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              songs={trends}
            />
          )}

          {/* スポットライトセクション */}
          {!isMounted || (spotlightLoading && spotlightData.length === 0) ? (
            <SectionSkeleton title="Spotlight" type="spotlight" />
          ) : (
            <SpotlightSection spotlightData={spotlightData} />
          )}

          {/* あなたへのおすすめセクション */}
          {!isMounted ||
          (recommendationsLoading && recommendations.length === 0) ? (
            <SectionSkeleton
              title="For You"
              description="Personalized recommendations based on your taste"
              type="forYou"
            />
          ) : (
            <ForYouSection recommendations={recommendations} />
          )}

          {/* 最新曲セクション */}
          {!isMounted || (latestLoading && latestSongs.length === 0) ? (
            <SectionSkeleton title="Latest Releases" type="latest" />
          ) : (
            <LatestReleasesSection songs={latestSongs} />
          )}

          {/* パブリックプレイリストセクション */}
          {!isMounted || (playlistsLoading && publicPlaylists.length === 0) ? (
            <SectionSkeleton title="Public Playlists" type="playlists" />
          ) : (
            <PlaylistsSection playlists={publicPlaylists} />
          )}

          {/* ジャンルボードセクション - 静的データ */}
          <GenreSection />
        </main>
      </div>
    </div>
  );
}
