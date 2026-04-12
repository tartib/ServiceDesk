import * as React from "react"
import { cn } from "@/lib/utils"
import {
 Table,
 TableHeader,
 TableBody,
 TableHead,
 TableRow,
 TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Column<T> {
 key: string
 header: string
 className?: string
 headerClassName?: string
 render: (row: T, index: number) => React.ReactNode
}

interface DataTableProps<T> {
 columns: Column<T>[]
 data: T[]
 isLoading?: boolean
 loadingRows?: number
 emptyIcon?: LucideIcon
 emptyTitle?: string
 emptyDescription?: string
 emptyAction?: React.ReactNode
 page?: number
 totalPages?: number
 onPageChange?: (page: number) => void
 onRowClick?: (row: T, index: number) => void
 rowClassName?: string | ((row: T, index: number) => string)
 className?: string
}

function DataTable<T>({
 columns,
 data,
 isLoading = false,
 loadingRows = 5,
 emptyIcon,
 emptyTitle = "No data found",
 emptyDescription,
 emptyAction,
 page,
 totalPages,
 onPageChange,
 onRowClick,
 rowClassName,
 className,
}: DataTableProps<T>) {
 return (
 <div
 data-slot="data-table"
 className={cn(
 "rounded-xl border bg-card shadow-sm overflow-hidden",
 className
 )}
 >
 {isLoading ? (
 <div className="p-4 space-y-3">
 {Array.from({ length: loadingRows }).map((_, i) => (
 <Skeleton key={i} className="h-12 w-full" />
 ))}
 </div>
 ) : data.length === 0 ? (
 <EmptyState
 icon={emptyIcon}
 title={emptyTitle}
 description={emptyDescription}
 action={emptyAction}
 />
 ) : (
 <>
 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow className="bg-muted/50 hover:bg-muted/50">
 {columns.map((col) => (
 <TableHead
 key={col.key}
 className={cn(
 "text-xs font-medium text-muted-foreground uppercase tracking-wider",
 col.headerClassName
 )}
 >
 {col.header}
 </TableHead>
 ))}
 </TableRow>
 </TableHeader>
 <TableBody>
 {data.map((row, idx) => (
 <TableRow
 key={idx}
 onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
 className={cn(
 onRowClick && "cursor-pointer",
 typeof rowClassName === "function"
 ? rowClassName(row, idx)
 : rowClassName
 )}
 >
 {columns.map((col) => (
 <TableCell key={col.key} className={col.className}>
 {col.render(row, idx)}
 </TableCell>
 ))}
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>

 {page !== undefined &&
 totalPages !== undefined &&
 totalPages > 1 &&
 onPageChange && (
 <div className="flex items-center justify-between px-4 py-3 border-t">
 <p className="text-sm text-muted-foreground">
 Page {page} of {totalPages}
 </p>
 <div className="flex items-center gap-1">
 <Button
 variant="outline"
 size="icon-sm"
 onClick={() => onPageChange(page - 1)}
 disabled={page <= 1}
 >
 <ChevronLeft className="h-4 w-4" />
 </Button>
 <Button
 variant="outline"
 size="icon-sm"
 onClick={() => onPageChange(page + 1)}
 disabled={page >= totalPages}
 >
 <ChevronRight className="h-4 w-4" />
 </Button>
 </div>
 </div>
 )}
 </>
 )}
 </div>
 )
}

export { DataTable }
export type { DataTableProps, Column }
