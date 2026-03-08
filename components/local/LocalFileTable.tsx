"use client";

import React, { useMemo } from "react";
import {
  Music,
  Clock,
  Disc,
  User,
  Play,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatTime } from "@/libs/utils";
import { LocalFile } from "@/types/local";

interface LocalFileTableProps {
  mp3Files: LocalFile[];
  onPlayFile: (file: LocalFile) => void;
}

const LocalFileTable: React.FC<LocalFileTableProps> = ({
  mp3Files,
  onPlayFile,
}) => {
  const columns = useMemo<ColumnDef<LocalFile>[]>(
    () => [
      {
        id: "title",
        accessorFn: (row) => {
          return (
            row.metadata?.common?.title ||
            (row.path ? row.path.split(/[\\/]/).pop() : "")
          );
        },
        header: () => (
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-theme-500/60 uppercase">
            <Music className="h-3 w-3" />
            <span>Title_Node</span>
          </div>
        ),
        cell: ({ row }) => {
          const file = row.original;
          const title =
            file.metadata?.common?.title ||
            (file.path ? file.path.split(/[\\/]/).pop() : "SCANNING...");

          return (
            <div className="flex items-center gap-4 group cursor-pointer font-mono">
              <div className="w-8 h-8 border border-theme-500/20 bg-[#0a0a0f] flex items-center justify-center relative transition-all group-hover:border-theme-500/60 group-hover:shadow-[0_0_10px_rgba(var(--theme-500),0.3)]">
                <Play className="h-3 w-3 text-theme-500 opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110" />
                <div className="absolute inset-0 bg-theme-500/0 group-hover:bg-theme-500/5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-white/80 truncate max-w-[250px] group-hover:text-theme-300 transition-colors uppercase tracking-tight">
                  {title}
                </span>
                {file.error ? (
                  <span className="text-[8px] text-red-500/60 uppercase tracking-widest mt-0.5">!! METADATA_CORRUPTION !!</span>
                ) : (
                  <span className="text-[8px] text-theme-500/30 uppercase tracking-[0.2em] mt-0.5 font-mono">
                    FS_OBJ_ENCODED
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "artist",
        accessorFn: (row) => {
          return row.metadata?.common?.artist || "UNKNOWN_SOURCE";
        },
        header: () => (
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-theme-500/60 uppercase">
            <User className="h-3 w-3" />
            <span>Source_Origin</span>
          </div>
        ),
        cell: ({ row }) => {
          const artist =
            row.original.metadata?.common?.artist || "UNKNOWN_SOURCE";
          return (
            <div className="flex items-center font-mono uppercase">
              <span className="text-[10px] text-theme-300/40 group-hover:text-theme-300 transition-colors tracking-wide">
                {artist}
              </span>
            </div>
          );
        },
      },
      {
        id: "album",
        accessorFn: (row) => {
          return row.metadata?.common?.album || "RESERVED_ARCHIVE";
        },
        header: () => (
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-theme-500/60 uppercase">
            <Disc className="h-3 w-3" />
            <span>Archive_Vol</span>
          </div>
        ),
        cell: ({ row }) => {
          const album =
            row.original.metadata?.common?.album || "RESERVED_ARCHIVE";
          return (
            <div className="flex items-center font-mono uppercase">
              <span className="text-[10px] text-theme-500/20 group-hover:text-theme-500/40 transition-colors truncate max-w-[150px]">
                {album}
              </span>
            </div>
          );
        },
      },
      {
        id: "duration",
        accessorFn: (row) => {
          return row.metadata?.format?.duration || 0;
        },
        header: () => (
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-theme-500/60 uppercase text-right justify-end">
            <Clock className="h-3 w-3" />
            <span>Sync_Len</span>
          </div>
        ),
        cell: ({ row }) => {
          const duration = row.original.metadata?.format?.duration || 0;
          return (
            <div className="flex items-center justify-end font-mono">
              <span className="text-[10px] text-theme-500/60 group-hover:text-theme-500 transition-colors tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          );
        },
      },
      {
        id: "genre",
        accessorFn: (row) => row.metadata?.common?.genre?.[0] || "",
        header: () => (
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-theme-500/60 uppercase">
            <span className="h-3 w-3 flex items-center justify-center font-black">#</span>
            <span>Tag_Ref</span>
          </div>
        ),
        cell: ({ row }) => {
          const genre = row.original.metadata?.common?.genre?.[0];
          return genre ? (
            <div className="flex items-center">
              <span className="px-2 py-0.5 border border-theme-500/20 bg-theme-500/5 text-[9px] text-theme-400 font-black uppercase tracking-widest">
                {genre}
              </span>
            </div>
          ) : (
            <span className="text-theme-500/10 text-[10px] font-mono">---</span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="cyber-table-container">
      <DataTable
        columns={columns}
        data={mp3Files}
        searchKey="title"
        onRowClick={onPlayFile}
      />
    </div>
  );
};

export default LocalFileTable;
