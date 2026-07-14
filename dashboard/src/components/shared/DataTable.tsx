import { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  // Server-side Pagination properties
  pageCount?: number
  page?: number
  onPageChange?: (page: number) => void
  // Search properties
  searchKey?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  pageCount = 1,
  page = 1,
  onPageChange,
  searchKey,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Cari...',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  const hasPagination = onPageChange !== undefined

  return (
    <div className="space-y-4 w-full">
      {/* Top Controls: Search */}
      {searchKey && onSearchChange && (
        <div className="relative flex items-center max-w-sm">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border-border bg-card text-foreground rounded-xl"
          />
        </div>
      )}

      {/* Table Frame */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-secondary/40 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-muted-foreground font-semibold text-xs py-4">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading Skeleton state
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="border-b border-border hover:bg-transparent animate-pulse">
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="py-4">
                      <div className="h-4 bg-secondary/80 rounded-md w-3/4 mx-auto" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              // Active rows
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-border hover:bg-secondary/20 transition-colors duration-150"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm font-medium py-3.5 text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Empty State
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-40 text-center py-8">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                    <p className="text-xs text-muted-foreground">Silakan sesuaikan filter atau tambahkan entri baru.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {hasPagination && (
        <div className="flex items-center justify-between px-2 py-2">
          {/* Current Info */}
          <div className="text-xs text-muted-foreground font-semibold">
            Halaman {page} dari {pageCount}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              className="border-border text-foreground hover:bg-secondary flex items-center gap-1 py-2 px-3 rounded-xl disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pageCount || isLoading}
              className="border-border text-foreground hover:bg-secondary flex items-center gap-1 py-2 px-3 rounded-xl disabled:opacity-50"
            >
              Berikutnya
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
export default DataTable
