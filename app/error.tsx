"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  const router = useRouter();

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] p-8 relative overflow-hidden font-mono">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(rgba(239, 68, 68, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.2) 1px, transparent 1px)`,
             backgroundSize: '20px 20px'
           }} 
      />
      <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full p-12 border border-red-500/40 bg-[#0a0a0f]/90 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.2)] cyber-glitch">
        {/* HUD装飾コーナー */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-red-500/60" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-red-500/60" />

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-500/20 border border-red-500 text-red-500">
             <span className="text-2xl font-bold animate-pulse">!</span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
              CRITICAL_SYSTEM_FAILURE
            </h2>
            <p className="text-[10px] text-red-500/60 uppercase tracking-widest mt-1">
              // ERROR_CODE: 0x{Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="bg-red-500/5 border border-red-500/20 p-6 mb-10 overflow-hidden relative">
           <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
           <p className="text-red-400 font-mono text-sm leading-relaxed uppercase tracking-tight break-all">
             {">"} EXCEPTION_DETECTED: {error.message}
           </p>
           <div className="mt-4 text-[10px] text-red-500/40 font-mono">
              LOCATION: UI_RENDER_STREAM // BYPASS_PROTOCOL: FAILED
           </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <button 
            onClick={() => reset()}
            className="px-8 py-3 bg-red-500/20 border border-red-500 text-white font-bold uppercase tracking-widest hover:bg-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300"
          >
            // INITIATE_RECOVERY
          </button>
          <button 
            onClick={() => router.push("/")}
            className="px-8 py-3 border border-theme-500/40 text-theme-500 font-bold uppercase tracking-widest hover:bg-theme-500/10 transition-all duration-300"
          >
            // RETURN_TO_BASE
          </button>
        </div>
      </div>
      
      {/* 装飾用警告テキスト */}
      <div className="absolute top-10 right-10 text-[8px] text-red-500/20 font-mono rotate-90">
         WARNING: UNAUTHORIZED_DATA_ACCESS_PREVENTED
      </div>
    </div>
  );
};

export default ErrorPage;
