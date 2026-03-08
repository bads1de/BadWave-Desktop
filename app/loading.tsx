"use client";

import { PulseLoader } from "react-spinners";
import Box from "@/components/common/Box";
import { motion } from "framer-motion";

const Loading = () => {
  return (
    <div className="h-full w-full flex items-center justify-center bg-[#0a0a0f] font-mono relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
      
      {/* 走査線 */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 bg-[length:100%_4px] bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)]" />

      <div className="relative">
        {/* バックグラウンドのblur */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-theme-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-theme-900/10 rounded-full blur-[120px] animate-pulse" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 flex flex-col items-center gap-8"
        >
          {/* サイバーパンク・ローディングアニメーション */}
          <div className="relative w-24 h-24">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-t-2 border-r-2 border-theme-500/40 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-b-2 border-l-2 border-theme-500/20 rounded-full"
            />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-8 bg-theme-500 shadow-[0_0_20px_rgba(var(--theme-500),0.8)] rounded-full"
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs text-theme-500 font-black tracking-[0.5em] uppercase"
            >
              // INITIALIZING_SYSTEM_LINK...
            </motion.p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 12, 4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1 bg-theme-500/40"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Loading;
