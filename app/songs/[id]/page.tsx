"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  memo,
  useCallback,
  use,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Heart,
  Share2,
  Download,
  Edit2,
  Clock,
  Music2,
  Pause,
  ClipboardCopy,
  Cloud,
  CloudOff,
} from "lucide-react";
import { MdLyrics } from "react-icons/md";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import useGetSongById from "@/hooks/data/useGetSongById";
import { useUser } from "@/hooks/auth/useUser";
import useGetSongsByGenres from "@/hooks/data/useGetSongGenres";
import EditModal from "@/components/modals/EditModal";
import { downloadFile } from "@/libs/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import AudioWaveform from "@/components/AudioWaveform";
import { getRandomColor } from "@/libs/utils";
import useAudioWaveStore from "@/hooks/audio/useAudioWave";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { electronAPI } from "@/libs/electron";
import { isLocalSong } from "@/libs/songUtils";

interface SongPageProps {
  params: Promise<{
    id: string;
  }>;
}

const SongPage = (props: SongPageProps) => {
  const params = use(props.params);
  const songId = params.id;

  const { song } = useGetSongById(songId);
  const { user } = useUser();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"lyrics" | "similar">("lyrics");
  const [duration, setDuration] = useState<string>("");
  const [primaryColor, setPrimaryColor] = useState(getRandomColor());
  const [secondaryColor, setSecondaryColor] = useState(getRandomColor());
  const [audioWaveformKey, setAudioWaveformKey] = useState(0);

  const genres = useMemo(
    () => song?.genre?.split(",").map((g) => g.trim()) || [],
    [song?.genre]
  );

  const { songGenres } = useGetSongsByGenres(genres, songId);

  const { isPlaying, play, pause, currentSongId, initializeAudio } =
    useAudioWaveStore();

  // オフラインキャッシュ用のフック
  const {
    download: cacheLocally,
    remove: removeCache,
    isDownloading: isCaching,
    isDownloaded: isCached,
  } = useDownloadSong(song ?? null);

  const isElectron = electronAPI.isElectron();

  useEffect(() => {
    setPrimaryColor(getRandomColor());
    setSecondaryColor(getRandomColor());
  }, [songId]);

  const handlePlayClick = useCallback(async () => {
    if (!song?.song_path) {
      console.error("曲のパスが存在しません");
      return;
    }

    try {
      console.log("再生を開始します", { songId, currentSongId });

      if (currentSongId !== songId) {
        await initializeAudio(song.song_path, songId);
        await play();
      } else {
        if (isPlaying) {
          pause();
        } else {
          await play();
        }
      }
    } catch (error) {
      console.error("再生処理中にエラーが発生しました:", error);
    }
  }, [
    song?.song_path,
    songId,
    currentSongId,
    isPlaying,
    initializeAudio,
    play,
    pause,
  ]);

  const handlePlaybackEnded = useCallback(() => {
    pause();
    setAudioWaveformKey((prevKey) => prevKey + 1);
  }, [pause]);

  useEffect(() => {
    if (song?.song_path) {
      const audio = new Audio(song.song_path);
      audio.addEventListener("loadedmetadata", () => {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        setDuration(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      });
    }
  }, [song?.song_path]);

  const handleDownloadClick = useCallback(async () => {
    setIsLoading(true);

    if (song?.song_path) {
      await downloadFile(song.song_path, `${song.title || "Untitled"}.mp3`);
    }

    setIsLoading(false);
  }, [song?.song_path, song?.title]);

  const copyLyricsToClipboard = useCallback(() => {
    try {
      navigator.clipboard.writeText(song?.lyrics || "");
      toast.success("Lyrics copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy lyrics.");
    }
  }, [song?.lyrics]);

  if (!song) {
    return (
      <div className="bg-[#0a0a0f] h-full w-full flex flex-col items-center justify-center gap-6 font-mono">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-2 border-theme-500/10 animate-ping" />
          <div className="absolute inset-4 border-2 border-theme-500/30 animate-spin" />
          <div className="absolute inset-8 border-2 border-theme-500 animate-pulse" />
        </div>
        <span className="text-theme-500 text-[10px] tracking-[0.4em] uppercase animate-pulse">
          // FETCHING_SONG_BUFFER...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] h-full w-full overflow-hidden overflow-y-auto custom-scrollbar relative font-mono">
      {/* 背景装飾 */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
      
      <div className="relative z-10">
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-theme-500/40 to-transparent z-30" />

        {/* Hero Section */}
        <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
          <Image
            src={song?.image_path || "/images/loading.gif"}
            alt="Song Cover"
            fill
            className="object-cover opacity-20 grayscale scale-110 blur-[10px]"
            unoptimized
            sizes="100vw"
          />
          
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/40 via-[#0a0a0f]/80 to-[#0a0a0f]" />
          
          {/* 波形可視化 */}
          <div className="absolute inset-0 z-20">
            <AudioWaveform
              key={audioWaveformKey}
              audioUrl={song.song_path!}
              isPlaying={isPlaying}
              onPlayPause={handlePlayClick}
              onEnded={handlePlaybackEnded}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              imageUrl={song.image_path!}
              songId={songId}
            />
          </div>

          {/* スキャンライン */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-30 bg-[length:100%_4px] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)]" />

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-40 bg-gradient-to-t from-[#0a0a0f] to-transparent">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-7xl mx-auto"
            >
              <div className="flex flex-col md:flex-row items-center md:items-end gap-10">
                {/* Album Art Container with HUD elements */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative group flex-shrink-0 cyber-glitch"
                >
                  <div className="relative w-48 h-48 md:w-72 md:h-72 border border-theme-500/20 p-2 bg-[#0a0a0f]/40 backdrop-blur-sm shadow-[0_0_30px_rgba(var(--theme-500),0.2)]">
                    {/* HUD Corners */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-theme-500 group-hover:w-10 group-hover:h-10 transition-all" />
                    <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-theme-500 group-hover:w-10 group-hover:h-10 transition-all" />
                    
                    <div className="relative w-full h-full overflow-hidden border border-theme-500/40">
                      <Image
                        src={song?.image_path || "/images/wait.jpg"}
                        alt="Song Cover"
                        fill
                        className="object-cover transition-all duration-1000 group-hover:scale-125"
                        sizes="(max-width: 640px) 192px, 288px"
                      />
                      <motion.div
                        className="absolute inset-0 bg-theme-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]"
                        onClick={handlePlayClick}
                      >
                        <div className="w-20 h-20 rounded-full bg-white/10 border border-white/40 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                          {isPlaying ? <Pause size={40} className="text-white fill-current" /> : <Play size={40} className="text-white fill-current ml-1" />}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                  
                </motion.div>

                {/* Song Info */}
                <div className="flex-grow text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <span className="w-2 h-2 bg-theme-500 animate-pulse shadow-[0_0_8px_rgba(var(--theme-500),0.8)]" />
                    <span className="text-[10px] text-theme-500 font-black tracking-[0.4em] uppercase">
                      STREAM_BUFFER_ACTIVE
                    </span>
                  </div>
                  
                  <h1 className="text-5xl md:text-8xl font-black mb-3 text-white uppercase tracking-tighter cyber-glitch drop-shadow-[0_0_15px_rgba(var(--theme-500),0.8)] break-all">
                    {song.title}
                  </h1>
                  
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
                    <p className="text-xl md:text-3xl text-theme-400 font-mono tracking-widest uppercase border-l-4 border-theme-500 pl-4">
                      // AUTH: {song.author}
                    </p>
                  </div>

                  {/* Tech Stats */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-8 py-4 border-y border-theme-500/10 text-[10px] font-bold text-theme-500/80 tracking-widest uppercase mb-8">
                    <div className="flex items-center gap-3 bg-theme-500/5 px-4 py-2 border border-theme-500/10">
                      <Play size={12} className="text-theme-500" />
                      <span>PLAYS_LOG: {song.count}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-theme-500/5 px-4 py-2 border border-theme-500/10">
                      <Heart size={12} className="text-theme-500" />
                      <span>AFFINITY_INDEX: {song.like_count}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-theme-500/5 px-4 py-2 border border-theme-500/10">
                      <Clock size={12} className="text-theme-500" />
                      <span>TEMPORAL_DURATION: {duration || "0:00"}</span>
                    </div>
                  </div>

                  {/* Action Buttons with Cyberpunk Style */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <Button
                      onClick={handlePlayClick}
                      className="bg-theme-500 hover:bg-theme-400 text-black text-[11px] font-black uppercase rounded-none px-8 h-10 tracking-[0.2em] shadow-[0_0_15px_rgba(var(--theme-500),0.3)] hover:shadow-[0_0_25px_rgba(var(--theme-500),0.5)] transition-all flex items-center gap-3"
                    >
                      {isPlaying ? (
                        <>
                          <Pause size={16} fill="black" />
                          <span>ABORT_LINK</span>
                        </>
                      ) : (
                        <>
                          <Play size={16} fill="black" />
                          <span>INIT_LINK</span>
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleDownloadClick}
                      disabled={isLoading}
                      variant="outline"
                      className="border-theme-500/40 text-theme-500 hover:bg-theme-500/5 hover:border-theme-500 text-[11px] font-black uppercase rounded-none px-6 h-10 tracking-[0.2em] transition-all flex items-center gap-3"
                    >
                      <Download size={16} />
                      <span>{isLoading ? "DOWNLOADING..." : "GET_ARCHIVE"}</span>
                    </Button>

                    {/* オフラインキャッシュボタン */}
                    {isElectron && !isLocalSong(song) && (
                      <Button
                        onClick={isCached ? removeCache : cacheLocally}
                        disabled={isCaching}
                        variant="outline"
                        className={twMerge(
                          "text-[11px] font-black uppercase rounded-none px-6 h-10 tracking-[0.2em] transition-all flex items-center gap-3",
                          isCached
                            ? "border-green-500/40 text-green-500 hover:bg-green-500/5 hover:border-green-500"
                            : "border-theme-500/40 text-theme-500 hover:bg-theme-500/5 hover:border-theme-500"
                        )}
                      >
                        {isCached ? (
                          <>
                            <CloudOff size={16} />
                            <span>{isCaching ? "PURGING..." : "CLEAR_CACHE"}</span>
                          </>
                        ) : (
                          <>
                            <Cloud size={16} />
                            <span>{isCaching ? "WRITING..." : "SAVE_OFFLINE"}</span>
                          </>
                        )}
                      </Button>
                    )}

                    {user?.id === song.user_id && (
                      <Button
                        onClick={() => setIsEditModalOpen(true)}
                        variant="outline"
                        className="border-theme-400/40 text-theme-400 hover:bg-theme-400/5 hover:border-theme-400 text-[11px] font-black uppercase rounded-none px-6 h-10 tracking-[0.2em] transition-all flex items-center gap-3"
                      >
                        <Edit2 size={16} />
                        <span>PATCH_BUFFER</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Genre Tags */}
          <div className="flex flex-wrap gap-3 mb-16">
            {genres.map((genre) => (
              <Link href={`/genre/${encodeURIComponent(genre)}`} key={genre}>
                <span className="px-5 py-2 border border-theme-500/20 bg-theme-500/5 text-[10px] text-theme-400 font-bold uppercase tracking-[0.2em] hover:bg-theme-500/20 hover:border-theme-500/40 transition-all cursor-pointer">
                  # {genre}
                </span>
              </Link>
            ))}
          </div>

          {/* Tabs */}
          <div className="mb-12 font-mono">
            <div className="border-b border-theme-500/10 pb-4">
              <div className="flex gap-10">
                <button
                  onClick={() => setActiveTab("lyrics")}
                  className={twMerge(
                    "relative uppercase tracking-[0.3em] font-black text-xs transition-colors",
                    activeTab === "lyrics"
                      ? "text-theme-500"
                      : "text-theme-900 hover:text-theme-500/60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <MdLyrics size={18} />
                    <span>LYRICS_ENCRYPTION</span>
                  </div>
                  {activeTab === "lyrics" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-[17px] left-0 right-0 h-1 bg-theme-500 shadow-[0_0_10px_rgba(var(--theme-500),0.5)]"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("similar")}
                  className={twMerge(
                    "relative uppercase tracking-[0.3em] font-black text-xs transition-colors",
                    activeTab === "similar"
                      ? "text-theme-500"
                      : "text-theme-900 hover:text-theme-500/60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Music2 size={18} />
                    <span>SIMILAR_NODES</span>
                  </div>
                  {activeTab === "similar" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-[17px] left-0 right-0 h-1 bg-theme-500 shadow-[0_0_10px_rgba(var(--theme-500),0.5)]"
                    />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "lyrics" ? (
              <motion.div
                key="lyrics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#0a0a0f] border border-theme-500/10 p-10 relative group rounded-none"
              >
                 {/* HUD Corners */}
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-theme-500/40" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-theme-500/40" />

                <Button
                  onClick={copyLyricsToClipboard}
                  variant="ghost"
                  className="absolute top-6 right-6 text-theme-500/40 hover:text-theme-500 transition-colors p-2 h-auto"
                >
                  <ClipboardCopy size={18} />
                </Button>
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-line font-mono text-lg leading-relaxed text-theme-300 uppercase tracking-tight">
                    {song.lyrics || "[ NO_LYRICS_DATA_FOUND_IN_SECTOR ]"}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="similar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {songGenres.map((similarSong) => (
                  <Link href={`/songs/${similarSong.id}`} key={similarSong.id}>
                    <Card className="group relative overflow-hidden bg-[#0a0a0f] border border-theme-500/20 rounded-none p-4 hover:border-theme-500/60 transition-all duration-500 cyber-glitch">
                      <div className="relative aspect-video border border-theme-500/10 overflow-hidden">
                        <Image
                          src={similarSong.image_path || "/images/liked.png"}
                          alt={similarSong.title}
                          fill
                          className="object-cover transition-all duration-700 group-hover:scale-125 group-hover:opacity-60"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <div className="w-12 h-12 rounded-full border border-theme-500 flex items-center justify-center bg-theme-500/20 backdrop-blur-sm">
                             <Play size={24} className="text-white fill-current" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 font-mono uppercase">
                        <h3 className="font-bold text-theme-300 text-sm truncate group-hover:text-white transition-colors">
                          {similarSong.title}
                        </h3>
                        <p className="text-theme-500/60 text-[10px] mt-1 tracking-widest">
                          {"//"} NODE: {similarSong.author}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <EditModal
          song={song}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default SongPage;
