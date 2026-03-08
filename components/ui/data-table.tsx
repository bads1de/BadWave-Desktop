"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="w-full font-mono">
      {searchKey && (
        <div className="flex items-center py-6">
          <div className="relative w-full max-w-md group">
            <div className="absolute -inset-0.5 bg-theme-500/20 rounded-none blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <Input
              placeholder="SEARCH_FOR_DATA_NODES..."
              value={
                (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="relative bg-[#0a0a0f] text-theme-300 border-theme-500/20 focus-visible:ring-theme-500/40 focus-visible:border-theme-500/60 transition-all duration-300 rounded-none uppercase tracking-widest text-[10px] h-10 px-4 placeholder:text-theme-500/20"
            />
            <div className="absolute top-0 right-0 h-full flex items-center pr-3 pointer-events-none">
              <span className="text-theme-500/40 text-[8px] animate-pulse">// SCANNING_ENABLED</span>
            </div>
          </div>
        </div>
      )}
      <div className="relative group">
        {/* 背景装飾 */}
        <div className="absolute -inset-1 bg-gradient-to-r from-theme-500/10 via-transparent to-theme-500/10 blur-xl opacity-20 pointer-events-none" />
        
        <ScrollArea className="rounded-xl border border-theme-500/10 bg-[#0a0a0f]/60 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden">
          {/* HUD装飾コーナー */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-theme-500/20 pointer-events-none rounded-tr-xl z-20" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-theme-500/20 pointer-events-none rounded-bl-xl z-20" />
          
          <Table>
            <TableHeader className="bg-theme-500/5 border-b border-theme-500/10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b-theme-500/10 hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="text-theme-500 font-black uppercase tracking-widest text-[10px] py-4 h-auto"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={`border-b-theme-500/5 transition-all duration-300 ${
                      onRowClick ? "cursor-pointer" : ""
                    } ${
                      index % 2 === 0 ? "bg-transparent" : "bg-theme-500/[0.02]"
                    } hover:bg-theme-500/10 group/row relative overflow-hidden`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 relative z-10">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                    {/* 行ホバー時のスキャンライン効果 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-theme-500/0 via-theme-500/[0.05] to-theme-500/0 translate-x-[-100%] group-hover/row:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-theme-500/20 font-mono text-xs uppercase tracking-[0.5em]"
                  >
                    [ ZERO_DATA_FOUND ]
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="flex items-center justify-between py-6 px-2">
        <div className="text-[10px] text-theme-500/40 uppercase tracking-[0.2em]">
          TOTAL_RECORDS: <span className="text-theme-500/60">{table.getFilteredRowModel().rows.length}</span> | 
          VIEWING_BLOCK: <span className="text-theme-500/60">{(table.getState().pagination.pageIndex + 1).toString().padStart(2, '0')}</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-theme-500/20 bg-transparent text-theme-500/60 hover:text-theme-500 hover:bg-theme-500/5 hover:border-theme-500/40 transition-all duration-300 rounded-none uppercase text-[9px] tracking-widest px-4 h-8 disabled:opacity-20"
          >
            { "<<" } PREV_SEGMENT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-theme-500/20 bg-transparent text-theme-500/60 hover:text-theme-500 hover:bg-theme-500/5 hover:border-theme-500/40 transition-all duration-300 rounded-none uppercase text-[9px] tracking-widest px-4 h-8 disabled:opacity-20"
          >
            NEXT_SEGMENT { ">>" }
          </Button>
        </div>
      </div>
    </div>
  );
}
