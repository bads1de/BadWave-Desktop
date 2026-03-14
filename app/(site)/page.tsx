"use client";

import { useState, useEffect } from "react";

// 繝・・繧ｿ蜿門ｾ励ヵ繝・け
import useGetRecommendations from "@/hooks/data/useGetRecommendations";
import useGetTrendSongs from "@/hooks/data/useGetTrendSongs";
import useGetSpotlight from "@/hooks/data/useGetSpotlight";
import useGetSongs from "@/hooks/data/useGetSongs";
import useGetPublicPlaylists from "@/hooks/data/useGetPublicPlaylists";

// 閭梧勹蜷梧悄繝輔ャ繧ｯ
import { useSyncTrends } from "@/hooks/sync/useSyncTrends";
import { useSyncSpotlight } from "@/hooks/sync/useSyncSpotlight";
import { useSyncLatestSongs } from "@/hooks/sync/useSyncLatestSongs";
import { useSyncRecommendations } from "@/hooks/sync/useSyncRecommendations";
import { useSyncPublicPlaylists } from "@/hooks/sync/useSyncPublicPlaylists";

// 繧ｻ繧ｯ繧ｷ繝ｧ繝ｳ繧ｳ繝ｳ繝昴・繝阪Φ繝・
import TrendSection from "@/components/home/TrendSection";
import SpotlightSection from "@/components/home/SpotlightSection";
import LatestReleasesSection from "@/components/home/LatestSection";
import ForYouSection from "@/components/home/ForYouSection";
import PlaylistsSection from "@/components/home/PlaylistsSection";
import GenreSection from "@/components/home/GenreSection";
import SectionSkeleton from "@/components/home/SectionSkeleton";

import Header from "@/components/header/Header";

/**
 * 繝帙・繝繝壹・繧ｸ
 *
 * 蜈ｨ縺ｦ縺ｮ繝・・繧ｿ繧偵け繝ｩ繧､繧｢繝ｳ繝医し繧､繝峨ヵ繝・け縺ｧ蜿門ｾ励＠縺ｾ縺吶・
 * TanStack Query 縺ｨ Electron Store 縺ｫ繧医ｋ豌ｸ邯壼喧繧ｭ繝｣繝・す繝･縺ｫ繧医ｊ縲・
 * 繧ｪ繝輔Λ繧､繝ｳ譎ゅｄ襍ｷ蜍墓凾縺ｫ繝ｭ繝ｼ繧ｫ繝ｫ繝・・繧ｿ繧貞叉蠎ｧ縺ｫ陦ｨ遉ｺ縺励∪縺吶・
 */
export default function Home() {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "all" | "month" | "week" | "day"
  >("all");

  // Hydration繧ｨ繝ｩ繝ｼ繧帝亟縺舌◆繧√√・繧ｦ繝ｳ繝育憾諷九ｒ邂｡逅・
  // 蛻晄悄繝ｬ繝ｳ繝繝ｪ繝ｳ繧ｰ・医し繝ｼ繝舌・・・け繝ｩ繧､繧｢繝ｳ繝医ワ繧､繝峨Ξ繝ｼ繧ｷ繝ｧ繝ｳ・画凾縺ｯ繧ｹ繧ｱ繝ｫ繝医Φ繧定｡ｨ遉ｺ縺励・
  // 繝槭え繝ｳ繝亥ｾ後↓繝・・繧ｿ縺後≠繧後・陦ｨ遉ｺ縺ｫ蛻・ｊ譖ｿ縺医ｋ縺薙→縺ｧ荳堺ｸ閾ｴ繧帝亟縺・
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 蜷・そ繧ｯ繧ｷ繝ｧ繝ｳ縺ｮ繝・・繧ｿ繧偵け繝ｩ繧､繧｢繝ｳ繝医し繧､繝峨〒繝輔ぉ繝・メ・医く繝｣繝・す繝･蜆ｪ蜈茨ｼ・
  const { trends, isLoading: trendsLoading } = useGetTrendSongs(selectedPeriod);
  const { spotlightData, isLoading: spotlightLoading } = useGetSpotlight();
  const { songs: latestSongs, isLoading: latestLoading } = useGetSongs();
  const { playlists: publicPlaylists, isLoading: playlistsLoading } =
    useGetPublicPlaylists();
  const { recommendations, isLoading: recommendationsLoading } =
    useGetRecommendations();

  // 閭梧勹蜷梧悄縺ｮ螳溯｡・(Electron迺ｰ蠅・ｸ九〒縺ｮ縺ｿ蜍穂ｽ・
  useSyncTrends(selectedPeriod);
  useSyncSpotlight();
  useSyncLatestSongs();
  useSyncRecommendations();
  useSyncPublicPlaylists();

  return (
    <div className="flex h-full overflow-hidden font-mono bg-[#0a0a0f] relative">
      {/* 閭梧勹陬・｣ｾ */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
      
      <div className="w-full h-full overflow-y-auto custom-scrollbar relative z-10">
        {/* 閭梧勹陬・｣ｾ */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
        
        <main className="relative px-6 py-12 pb-24 space-y-24 max-w-7xl mx-auto">
          {/* 繝医Ξ繝ｳ繝峨・繝ｼ繝峨そ繧ｯ繧ｷ繝ｧ繝ｳ */}
          {!isMounted || (trendsLoading && trends.length === 0) ? (
            <SectionSkeleton title="Trends" type="trend" />
          ) : (
            <TrendSection
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              songs={trends}
            />
          )}

          {/* 繧ｹ繝昴ャ繝医Λ繧､繝医そ繧ｯ繧ｷ繝ｧ繝ｳ */}
          {!isMounted || (spotlightLoading && spotlightData.length === 0) ? (
            <SectionSkeleton title="Spotlight" type="spotlight" />
          ) : (
            <SpotlightSection spotlightData={spotlightData} />
          )}

          {/* 縺ゅ↑縺溘∈縺ｮ縺翫☆縺吶ａ繧ｻ繧ｯ繧ｷ繝ｧ繝ｳ */}
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

          {/* 譛譁ｰ譖ｲ繧ｻ繧ｯ繧ｷ繝ｧ繝ｳ */}
          {!isMounted || (latestLoading && latestSongs.length === 0) ? (
            <SectionSkeleton title="Latest Releases" type="latest" />
          ) : (
            <LatestReleasesSection songs={latestSongs} />
          )}

          {/* 繝代ヶ繝ｪ繝・け繝励Ξ繧､繝ｪ繧ｹ繝医そ繧ｯ繧ｷ繝ｧ繝ｳ */}
          {!isMounted || (playlistsLoading && publicPlaylists.length === 0) ? (
            <SectionSkeleton title="Public Playlists" type="playlists" />
          ) : (
            <PlaylistsSection playlists={publicPlaylists} />
          )}

          {/* 繧ｸ繝｣繝ｳ繝ｫ繝懊・繝峨そ繧ｯ繧ｷ繝ｧ繝ｳ - 髱咏噪繝・・繧ｿ */}
          <GenreSection />
        </main>
      </div>
    </div>
  );
}

