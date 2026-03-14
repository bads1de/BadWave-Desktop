"use client";

import Header from "@/components/header/Header";
import SongListContent from "@/components/song/SongListContent";

const Liked = () => {
  return (
    <div className="bg-[#0a0a0f] w-full h-full overflow-hidden overflow-y-auto custom-scrollbar relative font-mono">
      {/* 背景装飾 */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />

      {/* 背景装飾 */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] z-0 bg-[length:100%_3px] bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)]" />

      <div className="relative z-10">
        <Header>
          <div className="flex items-center justify-between w-full px-4 lg:px-8 py-4 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-theme-500/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-theme-500/5 blur-[100px] -mr-16 -mt-16 animate-pulse" />

            <div className="flex flex-col relative z-20">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-[2px] bg-theme-500 animate-[pulse_2s_infinite]" />
                <span className="text-[10px] text-theme-500 font-black tracking-[0.5em] uppercase">
                  SECURE_STORAGE_FACILITY
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-[-0.05em] text-white uppercase relative">
                DEEP_COLLECTION
                <span className="absolute -inset-1 bg-theme-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>

              <div className="flex items-center gap-4 text-[9px] text-theme-500/40 uppercase tracking-[0.3em] font-mono mt-2">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 border border-theme-500/40 flex items-center justify-center">
                    <span className="w-1 h-1 bg-theme-500 animate-pulse" />
                  </span>
                  NODE_STATUS: ONLINE
                </span>
                <span>// ENCRYPTION: 0x256_AES</span>
                <span className="hidden sm:inline">
                  // VOLUME: 0xLIKED_VAULT
                </span>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end gap-1 relative z-20">
              <div className="text-[8px] text-theme-500/30 uppercase tracking-[0.4em]">
                Data_Registry_Access
              </div>
              <div className="flex items-center gap-2 bg-theme-500/5 border border-theme-500/10 px-3 py-1">
                <span className="w-1 h-1 bg-theme-500 animate-ping" />
                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                  AUTHORIZED_SESSION
                </span>
              </div>
            </div>

            {/* Corner Deco */}
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-theme-500/20" />
          </div>
        </Header>

        <div className="max-w-[1400px] mx-auto py-8">
          <SongListContent />
        </div>
      </div>
    </div>
  );
};

export default Liked;
