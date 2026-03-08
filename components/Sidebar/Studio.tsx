"use client";

import { AiOutlinePlus } from "react-icons/ai";
import { RiPlayListFill, RiPulseLine } from "react-icons/ri";
import { GiMicrophone } from "react-icons/gi";
import { BsWrench } from "react-icons/bs";
import useAuthModal from "@/hooks/auth/useAuthModal";
import { useUser } from "@/hooks/auth/useUser";
import useUploadModal from "@/hooks/modal/useUploadModal";
import usePlaylistModal from "@/hooks/modal/usePlaylistModal";
import useSpotLightUploadModal from "@/hooks/modal/useSpotLightUpload";
import usePulseUploadModal from "@/hooks/modal/usePulseUploadModal";
import Hover from "../common/Hover";
import { checkIsAdmin } from "@/actions/checkAdmin";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { twMerge } from "tailwind-merge";

interface StudioProps {
  isCollapsed: boolean;
}

const Studio: React.FC<StudioProps> = ({ isCollapsed }) => {
  const { user } = useUser();
  const authModal = useAuthModal();
  const uploadModal = useUploadModal();
  const playlistModal = usePlaylistModal();
  const spotlightUploadModal = useSpotLightUploadModal();
  const pulseUploadModal = usePulseUploadModal();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { isAdmin } = await checkIsAdmin();
        setIsAdmin(isAdmin);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  const openModal = (value: "music" | "playlist" | "spotlight" | "pulse") => {
    if (!user) {
      return authModal.onOpen();
    }

    switch (value) {
      case "music":
        if (!isAdmin) {
          return toast.error("管理者権限が必要です");
        }
        return uploadModal.onOpen();
      case "playlist":
        return playlistModal.onOpen();
      case "spotlight":
        if (!isAdmin) {
          return toast.error("管理者権限が必要です");
        }
        return spotlightUploadModal.onOpen();
      case "pulse":
        if (!isAdmin) {
          return toast.error("管理者権限が必要です");
        }
        return pulseUploadModal.onOpen();
    }
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={twMerge(
            "cursor-pointer transition",
            isCollapsed
              ? "w-full flex items-center justify-center border-b border-transparent"
              : "flex h-auto w-full items-center gap-x-4 py-3.5 px-4 rounded-xl",
            "border-transparent text-neutral-400 hover:text-white"
          )}
        >
          {isCollapsed ? (
            <Hover
              description="スタジオ"
              contentSize="w-auto px-3 py-2"
              side="right"
            >
              <div className="p-3 rounded-xl">
                <BsWrench size={20} className="text-neutral-400" />
              </div>
            </Hover>
          ) : (
            <>
              <BsWrench size={24} />
              <p className="truncate text-sm font-medium">スタジオ</p>
            </>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-60 p-2 bg-neutral-900/95 backdrop-blur-xl border border-white/10 shadow-xl"
      >
        <div className="flex flex-col gap-y-1">
          <button
            onClick={() => openModal("playlist")}
            className="flex items-center gap-x-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-neutral-400 hover:text-white hover:bg-white/5 w-full text-left"
          >
            <div className="p-2 rounded-lg bg-theme-500/10">
              <RiPlayListFill size={18} className="text-theme-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">プレイリストを作成</span>
            </div>
          </button>

          <button
            onClick={() => openModal("music")}
            className="flex items-center gap-x-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-neutral-400 hover:text-white hover:bg-white/5 w-full text-left"
          >
            <div className="p-2 rounded-lg bg-theme-500/10">
              <AiOutlinePlus size={18} className="text-theme-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">曲を追加</span>
            </div>
          </button>

          <button
            onClick={() => openModal("spotlight")}
            className="flex items-center gap-x-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-neutral-400 hover:text-white hover:bg-white/5 w-full text-left"
          >
            <div className="p-2 rounded-lg bg-theme-500/10">
              <GiMicrophone size={18} className="text-theme-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">スポットライト</span>
            </div>
          </button>

          <button
            onClick={() => openModal("pulse")}
            className="flex items-center gap-x-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-neutral-400 hover:text-white hover:bg-white/5 w-full text-left"
          >
            <div className="p-2 rounded-lg bg-theme-500/10">
              <RiPulseLine size={18} className="text-theme-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Pulseを投稿</span>
            </div>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Studio;
