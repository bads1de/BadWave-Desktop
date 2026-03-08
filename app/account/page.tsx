"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";

import { createClient } from "@/libs/supabase/client";
import { useUser } from "@/hooks/auth/useUser";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Palette, Database, Activity, BarChart2 } from "lucide-react";
import { AccountModal } from "@/components/Account/AccountModal";
import { ColorSchemeSelector } from "@/components/Account/ColorSchemeSelector";
import TopPlayedSongs from "@/components/Account/TopPlayedSongs";
import StatsOverview from "@/components/Account/StatsOverview";
import { SyncSection } from "@/components/Account/SyncSection";

const AccountPage = () => {
  const router = useRouter();
  const { userDetails: user } = useUser();
  const supabaseClient = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabaseClient.auth.signOut();
      router.push("/");
      toast.success("ログアウトしました");
    } catch (error) {
      toast.error("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0f] h-full w-full overflow-hidden overflow-y-auto custom-scrollbar relative font-mono">
      {/* 背景装飾 */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
      
      <div className="relative z-10 px-6 py-8 md:px-10 lg:px-12 space-y-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-theme-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-theme-500 font-black tracking-[0.4em] uppercase">
              USER_PROFILE_SYSTEM
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tight cyber-glitch drop-shadow-[0_0_15px_rgba(var(--theme-500),0.3)]">
            ACCOUNT_SETTINGS
          </h1>
        </div>

        <div className="space-y-12">
          {/* プロフィールセクション (HUDスタイル) */}
          <div className="relative bg-[#0a0a0f] border border-theme-500/10 p-8 rounded-none overflow-hidden group">
            {/* HUD装飾 */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-theme-500/40 group-hover:border-theme-500 transition-all" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-theme-500/40 group-hover:border-theme-500 transition-all" />
            
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-10">
              <div className="relative group/avatar">
                <div className="relative w-32 h-32 md:w-40 md:h-40 border border-theme-500/30 p-1 bg-black/40">
                   {/* Avatar corners */}
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t border-r border-theme-500" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b border-l border-theme-500" />
                  
                  <div className="relative w-full h-full overflow-hidden grayscale-[30%] group-hover/avatar:grayscale-0 transition-all duration-500">
                    <Image
                      src={user?.avatar_url || "/images/default-avatar.png"}
                      alt="Profile"
                      fill
                      className="object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                    />
                  </div>
                </div>
                
                {/* Tech info floating */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full text-center">
                  <span className="text-[8px] text-theme-500/60 uppercase tracking-[0.3em] font-black">
                    ID: 0x{user?.id?.substring(0, 8).toUpperCase() || "NULL"}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-widest break-all">
                    {user?.full_name || "UNIDENTIFIED_USER"}
                  </h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] text-theme-500/60 uppercase tracking-widest">
                      // AUTH_STATUS: VERIFIED
                    </span>
                    <span className="text-[10px] text-theme-500/60 uppercase tracking-widest">
                      // ACCESS_LVL: NULL_SEC
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="relative bg-theme-500 hover:bg-theme-400 text-black px-8 py-3 rounded-none font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(var(--theme-500),0.3)] hover:shadow-[0_0_25px_rgba(var(--theme-500),0.5)] transition-all"
                  >
                    PATCH_PROFILE
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="relative border border-red-500/40 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-500 px-8 py-3 rounded-none font-black text-xs uppercase tracking-[0.2em] transition-all"
                  >
                    {isLoading ? "TERMINATING..." : "TERMINATE_SESSION"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="appearance" className="space-y-10">
            <TabsList className="bg-[#0a0a0f] p-0 border-b border-theme-500/10 rounded-none h-auto w-full justify-start gap-8 flex-wrap">
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-3 py-4 px-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-theme-500 text-theme-500/40 border-b-2 border-transparent data-[state=active]:border-theme-500 uppercase font-black text-[10px] tracking-[0.3em] transition-all"
              >
                <Palette className="w-4 h-4" />
                INTERFACE
              </TabsTrigger>
              <TabsTrigger
                value="library"
                className="flex items-center gap-3 py-4 px-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-theme-500 text-theme-500/40 border-b-2 border-transparent data-[state=active]:border-theme-500 uppercase font-black text-[10px] tracking-[0.3em] transition-all"
              >
                <Database className="w-4 h-4" />
                DATABASE
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="flex items-center gap-3 py-4 px-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-theme-500 text-theme-500/40 border-b-2 border-transparent data-[state=active]:border-theme-500 uppercase font-black text-[10px] tracking-[0.3em] transition-all"
              >
                <Activity className="w-4 h-4" />
                LOGS
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="flex items-center gap-3 py-4 px-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-theme-500 text-theme-500/40 border-b-2 border-transparent data-[state=active]:border-theme-500 uppercase font-black text-[10px] tracking-[0.3em] transition-all"
              >
                <BarChart2 className="w-4 h-4" />
                METRICS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="mt-0 outline-none">
              <ColorSchemeSelector />
            </TabsContent>

            <TabsContent value="library" className="mt-0 outline-none">
              <SyncSection />
            </TabsContent>

            <TabsContent value="activity" className="mt-0 outline-none">
              <TopPlayedSongs user={user} />
            </TabsContent>

            <TabsContent value="stats" className="mt-0 outline-none">
              <StatsOverview />
            </TabsContent>
          </Tabs>

          <AccountModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={user}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
