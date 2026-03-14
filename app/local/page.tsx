"use client";

import React, { useState, useCallback, useEffect } from "react";
import Header from "@/components/header/Header";
import { Button } from "@/components/ui/button";
import { mapFileToSong } from "@/libs/localFileMappers";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import {
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import usePlayer from "@/hooks/player/usePlayer";
import useGetLocalFiles from "@/hooks/data/useGetLocalFiles";
import useGetSavedLibraryInfo from "@/hooks/data/useGetSavedLibraryInfo";
import LocalFileTable from "@/components/local/LocalFileTable";
import { motion } from "framer-motion";
import { LocalFile } from "@/types/local";

const LocalPage = () => {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(
    null
  );
  const [isSelectingDirectory, setIsSelectingDirectory] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);

  // 統合プレイヤーシステムを使用
  const player = usePlayer();

  // TanStack Query を使用してキャッシュ戦略を適用
  const { libraryInfo: savedLibraryInfo, isLoading: isLoadingLibraryInfo } =
    useGetSavedLibraryInfo();

  // 保存されたディレクトリを自動選択
  useEffect(() => {
    if (
      savedLibraryInfo?.exists &&
      savedLibraryInfo?.directoryExists &&
      !selectedDirectory
    ) {
      setSelectedDirectory(savedLibraryInfo.directoryPath || null);
    }
  }, [savedLibraryInfo, selectedDirectory]);

  // ローカルファイルを取得（キャッシュ対応）
  const {
    files: mp3Files,
    isLoading,
    error,
    scanInfo: lastScanInfo,
    scanProgress,
    forceRescan,
  } = useGetLocalFiles(selectedDirectory);

  // フォルダ選択ダイアログを表示
  const handleSelectDirectory = async () => {
    setIsSelectingDirectory(true);
    setSelectError(null);

    try {
      const result = await window.electron.ipc.invoke(
        "handle-select-directory"
      );

      if (result.canceled) {
        console.log("フォルダ選択がキャンセルされました。");
        setIsSelectingDirectory(false);
        return;
      }

      if (result.error) {
        console.error("フォルダ選択エラー:", result.error);
        setSelectError(`フォルダ選択エラー: ${result.error}`);
        setIsSelectingDirectory(false);
        return;
      }

      setSelectedDirectory(result.filePath);
    } catch (err: any) {
      console.error("フォルダ選択中にエラーが発生しました:", err);
      setSelectError(`フォルダ選択中にエラーが発生しました: ${err.message}`);
    } finally {
      setIsSelectingDirectory(false);
    }
  };

  // 強制的に完全なスキャンを実行
  const handleForceFullScan = useCallback(async () => {
    await forceRescan();
  }, [forceRescan]);

  /**
   * ファイルを再生する（統合プレイヤーシステムを使用）
   * @param {LocalFile} file - 再生するファイル
   */
  const handlePlayFile = useCallback(
    (file: LocalFile) => {
      if (file.path) {
        const song = mapFileToSong(file);
        // ローカル曲をプレイヤーストアに保存
        player.setLocalSong(song);

        // 全てのローカル曲をプレイヤーストアに保存し、IDリストを作成
        const songIds: string[] = [];
        mp3Files.forEach((f) => {
          if (f.path) {
            const localSong = mapFileToSong(f);
            player.setLocalSong(localSong);
            songIds.push(localSong.id);
          }
        });

        // プレイリストを設定
        player.setIds(songIds);
        // 現在の曲を設定
        player.setId(song.id);
      }
    },
    [player, mp3Files]
  );

  // エラーメッセージ（選択エラーまたはスキャンエラー）
  const errorMessage =
    selectError ||
    (error instanceof Error ? error.message : error ? String(error) : null);

  return (
    <div className="bg-[#0a0a0f] h-full w-full overflow-hidden overflow-y-auto pb-[80px] custom-scrollbar relative font-mono">
      {/* 閭梧勹陬・｣ｾ */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
      
      <div className="relative z-10">
        <Header className="sticky top-0 z-20">
          <div className="flex items-center justify-between w-full px-4 lg:px-8 py-2">
            <div className="flex flex-col">
              <h1 className="text-4xl font-black tracking-[0.2em] text-white uppercase cyber-glitch">
                LOCAL_STORAGE
              </h1>
              <div className="flex items-center gap-4 text-[8px] text-theme-500/60 uppercase tracking-[0.3em] font-mono mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-theme-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(var(--theme-500),0.5)]" />
                  FS_STATUS: READ_ONLY
                </span>
                <span>// SECTOR: LOCAL_NODE</span>
                <span className="hidden sm:inline">// ENCRYPTION: NONE</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 border-l border-theme-500/10 pl-8 font-mono">
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-theme-500/40 uppercase tracking-widest">Buffer_Sync</span>
                <span className="text-xs text-theme-300 font-bold tabular-nums">READY</span>
              </div>
            </div>
          </div>
        </Header>

      <div className="mt-4 mb-7 px-6">
        {/* 保存されたライブラリ情報 */}
        {savedLibraryInfo?.exists &&
          savedLibraryInfo.directoryExists &&
          !selectedDirectory && (
            <div className="bg-[#0a0a0f]/60 backdrop-blur-md border border-theme-500/20 p-4 mb-8 relative group overflow-hidden rounded-xl">
               {/* HUD装飾 */}
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-theme-500/40 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-theme-500/40 rounded-bl-xl" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-6 bg-theme-500 shadow-[0_0_10px_rgba(var(--theme-500),0.5)]" />
                <span className="font-black text-white uppercase tracking-widest text-sm">
                  // SAVED_LIBRARY_DETECTED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] text-theme-300/60 uppercase tracking-widest">
                <div className="space-y-1">
                  <p className="text-theme-500/40 text-[8px]">Mount_Point</p>
                  <p className="text-white truncate">{savedLibraryInfo.directoryPath}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-theme-500/40 text-[8px]">Stream_Count</p>
                  <p className="text-white">{savedLibraryInfo.fileCount} UNITS</p>
                </div>
                <div className="space-y-1">
                  <p className="text-theme-500/40 text-[8px]">Last_Sync</p>
                  <p className="text-white">
                    {savedLibraryInfo.lastScan
                      ? formatDistanceToNow(
                          new Date(savedLibraryInfo.lastScan),
                          {
                            addSuffix: true,
                            locale: ja,
                          }
                        )
                      : "NULL"}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={() =>
                    setSelectedDirectory(savedLibraryInfo.directoryPath || null)
                  }
                  className="w-full md:w-auto bg-theme-500 hover:bg-theme-400 text-[#0a0a0f] text-[10px] font-black uppercase rounded-xl tracking-widest h-9 px-8 transition-all hover:shadow-[0_0_15px_rgba(var(--theme-500),0.4)]"
                >
                  INITIALIZE_ARCHIVE
                </Button>
              </div>
            </div>
          )}

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <Button
            onClick={handleSelectDirectory}
            disabled={isLoading || isSelectingDirectory}
            className="w-full md:w-auto bg-transparent border border-theme-500/40 hover:border-theme-500 text-theme-500 hover:bg-theme-500/5 text-[10px] font-black uppercase rounded-xl tracking-widest h-10 px-8 transition-all group"
          >
            {isLoading || isSelectingDirectory ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-3 w-3 border-2 border-theme-500 border-t-transparent inline-block"></div>
                <span className="animate-pulse">PROCESSING...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>MOUNT_DIRECTORY</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">_</span>
              </div>
            )}
          </Button>

          {selectedDirectory && !isLoading && !errorMessage && (
            <div className="flex flex-col gap-1 border-l border-theme-500/20 pl-4 py-1">
              <span className="text-[8px] text-theme-500/40 uppercase tracking-widest">Active_Path</span>
              <span className="text-[10px] text-theme-300 uppercase truncate max-w-md">{selectedDirectory}</span>
            </div>
          )}

          {selectedDirectory && !isLoading && (
            <Button
              onClick={handleForceFullScan}
              className="w-full md:w-auto bg-[#1a1a1f] border border-white/5 hover:border-white/20 text-white/60 hover:text-white text-[10px] font-black uppercase rounded-xl tracking-widest h-10 px-6 transition-all"
              title="すべてのファイルを再スキャンします"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              <span>RE_SCAN_FS</span>
            </Button>
          )}
        </div>

        {errorMessage && (
          <div className="bg-red-500/5 border border-red-500/40 p-4 mb-8 text-red-500 font-mono text-[10px] tracking-widest flex items-center gap-3 animate-shake rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <span className="uppercase">// ERROR: {errorMessage}</span>
          </div>
        )}

        {/* スキャン進捗表示 */}
        {scanProgress && (
          <div className="bg-[#0a0a0f]/60 backdrop-blur-md border border-theme-500/20 p-6 mb-8 relative rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {scanProgress.phase !== "complete" ? (
                  <RefreshCw className="h-4 w-4 text-theme-500 animate-spin" />
                ) : (
                  <div className="h-2 w-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                )}
                <span className="text-theme-300 font-black uppercase tracking-widest text-[10px]">
                  {scanProgress.message}
                </span>
              </div>
              <span className="text-theme-500/40 text-[10px] font-mono">
                {Math.round((scanProgress.current / scanProgress.total) * 100)}%
              </span>
            </div>

            {/* 繝励Ο繧ｰ繝ｬ繧ｹ繝舌・ */}
            {scanProgress.total > 0 && (
              <div className="space-y-3">
                <div className="w-full bg-theme-500/5 h-1 border border-theme-500/10 overflow-hidden rounded-full">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(scanProgress.current / scanProgress.total) * 100}%` 
                    }}
                    className="bg-theme-500 h-full shadow-[0_0_10px_rgba(var(--theme-500),0.8)]"
                  />
                </div>
                <div className="flex justify-between text-[8px] text-theme-500/40 uppercase tracking-[0.2em]">
                  <span className="truncate max-w-[70%]">
                    {scanProgress.currentFile ? `>> ${scanProgress.currentFile}` : "IDLE_STREAM"}
                  </span>
                  <span>
                    INDEX: {scanProgress.current.toString().padStart(4, '0')} / {scanProgress.total.toString().padStart(4, '0')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ陦ｨ遉ｺ・磯ｲ謐玲ュ蝣ｱ縺後↑縺・ｴ蜷茨ｼ・*/}
        {isLoading && !scanProgress && (
          <div className="py-24 flex flex-col items-center justify-center gap-6 border border-theme-500/10 mb-8 rounded-xl">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-theme-500/10 animate-ping rounded-full" />
              <div className="absolute inset-4 border-2 border-theme-500/30 animate-spin rounded-full" />
              <div className="absolute inset-8 border-2 border-theme-500 animate-pulse rounded-full" />
            </div>
            <span className="text-theme-500 text-[10px] tracking-[0.4em] uppercase animate-pulse">
              // INITIALIZING_IO_THREAD...
            </span>
          </div>
        )}

        {/* 繧ｹ繧ｭ繝｣繝ｳ邨先棡縺ｮ陦ｨ遉ｺ */}
        {lastScanInfo && !isLoading && mp3Files.length > 0 && (
          <div className="bg-theme-500/5 border-y border-theme-500/20 p-4 mb-8 flex items-center justify-between text-[8px] uppercase tracking-[0.3em] font-mono rounded-xl">
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <span className="text-theme-500/40">Mode:</span>
                <span className={lastScanInfo.isFullScan ? "text-theme-500" : "text-cyan-400"}>
                  {lastScanInfo.isFullScan ? "FULL_SYNC" : "DIFF_SYNC"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-theme-500/40">New:</span>
                <span className="text-green-400">{lastScanInfo.newFiles.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-theme-500/40">Modified:</span>
                <span className="text-yellow-400">{lastScanInfo.modifiedFiles.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-theme-500/40">Deleted:</span>
                <span className="text-red-400">{lastScanInfo.deletedFiles.length}</span>
              </div>
            </div>
            <div className="text-theme-500/20 animate-pulse">SYSTEM_STABLE</div>
          </div>
        )}

        {!isLoading &&
          mp3Files.length === 0 &&
          selectedDirectory &&
          !errorMessage && (
            <div className="py-32 flex flex-col items-center justify-center gap-4 text-theme-500/20 border border-theme-500/10 mb-8 rounded-xl">
              <h2 className="text-xl uppercase tracking-[0.5em] font-black">[ ZERO_BLOCKS ]</h2>
              <p className="text-[10px] uppercase tracking-widest text-center mt-2 max-w-sm px-6">
                // NO_VALID_AUDIO_BUFFERS_DETECTED_IN_MOUNT_POINT. PROCEED_TO_RESCAN_OR_CHANGE_PATH.
              </p>
            </div>
          )}

        {/* 繝・・繝悶Ν繧ｳ繝ｳ繝昴・繝阪Φ繝医ｒ菴ｿ逕ｨ */}
        {mp3Files.length > 0 && !isLoading && (
          <div className="mt-6 mb-4">
            <LocalFileTable mp3Files={mp3Files} onPlayFile={handlePlayFile} />
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default LocalPage;
