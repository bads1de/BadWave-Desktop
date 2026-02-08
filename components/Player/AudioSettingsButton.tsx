"use client";

import React, { useState } from "react";
import { Settings2, Music2, SlidersVertical } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import usePlaybackRateStore from "@/hooks/stores/usePlaybackRateStore";
import useEqualizerStore from "@/hooks/stores/useEqualizerStore";
import useEffectStore from "@/hooks/stores/useEffectStore";
import useSpatialStore from "@/hooks/stores/useSpatialStore";
import SpeedAndEffectsControl from "./SpeedAndEffectsControl";
import EqualizerControl from "../Equalizer/EqualizerControl";

type Tab = "effects" | "equalizer";

const AudioSettingsButton: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("effects");

  // オーディオ設定が有効かどうかをチェックしてアイコンの色を変えるためのstate
  const playbackRate = usePlaybackRateStore((state) => state.rate);
  const isEqualizerEnabled = useEqualizerStore((state) => state.isEnabled);
  const isSpatialEnabled = useSpatialStore((state) => state.isSpatialEnabled);
  const is8DAudioEnabled = useEffectStore((state) => state.is8DAudioEnabled);
  const isRetroEnabled = useEffectStore((state) => state.isRetroEnabled);
  const isBassBoostEnabled = useEffectStore(
    (state) => state.isBassBoostEnabled,
  );
  const isSlowedReverb = useEffectStore((state) => state.isSlowedReverb);

  const isAnyEffectActive =
    playbackRate !== 1 ||
    isEqualizerEnabled ||
    isSpatialEnabled ||
    is8DAudioEnabled ||
    isRetroEnabled ||
    isBassBoostEnabled ||
    isSlowedReverb;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`cursor-pointer transition-all duration-300 hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
            isAnyEffectActive
              ? "text-theme-500 drop-shadow-[0_0_8px_var(--glow-color)]"
              : "text-neutral-400 hover:text-white"
          }`}
          title="オーディオ設定 (速度・エフェクト・イコライザー)"
        >
          <Settings2 size={20} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-[360px] p-0 bg-[#1a1a1a] border-[#333333] overflow-hidden"
      >
        {/* タブヘッダー */}
        <div className="flex border-b border-[#333333]">
          <button
            onClick={() => setActiveTab("effects")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
              activeTab === "effects"
                ? "bg-[#252525] text-white border-b-2 border-theme-500"
                : "text-neutral-400 hover:text-white hover:bg-[#252525]/50"
            }`}
          >
            <Music2 size={14} />
            <span>Effects & Speed</span>
          </button>
          <button
            onClick={() => setActiveTab("equalizer")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
              activeTab === "equalizer"
                ? "bg-[#252525] text-white border-b-2 border-theme-500"
                : "text-neutral-400 hover:text-white hover:bg-[#252525]/50"
            }`}
          >
            <SlidersVertical size={14} />
            <span>Equalizer</span>
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          {activeTab === "effects" ? (
            <SpeedAndEffectsControl />
          ) : (
            <EqualizerControl className="!bg-transparent !border-none !rounded-none !p-0 !min-w-0 shadow-none" />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AudioSettingsButton;
