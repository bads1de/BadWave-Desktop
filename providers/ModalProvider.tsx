"use client";

import AuthModal from "@/components/modals/AuthModal";
import PlaylistModal from "@/components/modals/PlaylistModal";
import SpotlightModal from "@/components/modals/SpotlightModal";
import UploadModal from "@/components/modals/UploadModal";
import { useEffect, useState } from "react";
import SpotlightUploadModal from "@/components/modals/SpotlightUploadModal";
import PulseUploadModal from "@/components/modals/PulseUploadModal";

const ModalProvider: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <AuthModal />
      <UploadModal />
      <PlaylistModal />
      <SpotlightModal />
      <SpotlightUploadModal />
      <PulseUploadModal />
    </>
  );
};

export default ModalProvider;

