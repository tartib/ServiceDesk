import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface FilterBarProps extends React.ComponentProps<"div"> {
 searchValue?: string
 onSearchChange?: (value: string) => void
 searchPlaceholder?: string
}

function FilterBar({
 searchValue,
 onSearchChange,
 searchPlaceholder = "Search...",
 className,
 children,
 ...props
}: FilterBarProps) {
 return (
 <div
 data-slot="filter-bar"
 className={cn(
 "rounded-xl border bg-card p-4 md:p-6 shadow-sm",
 className
 )}
 {...props}
 >
 <div className="flex flex-col md:flex-row gap-4 md:gap-6">
 {onSearchChange !== undefined && (
 <div className="flex-1 min-w-0">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
 <Input
 type="text"
 placeholder={searchPlaceholder}
 value={searchValue}
 onChange={(e) => onSearchChange(e.target.value)}
 className="pl-9"
 />
 </div>
 </div>
 )}
 {children}
 </div>
 </div>
 )
}

type FilterGroupProps = React.ComponentProps<"div">

function FilterGroup({ className, ...props }: FilterGroupProps) {
 return (
 <div
 data-slot="filter-group"
 className={cn("flex flex-wrap items-center gap-2", className)}
 {...props}
 />
 )
}

interface FilterPillProps extends React.ComponentProps<"button"> {
 active?: boolean
}

function FilterPill({
 active = false,
 className,
 ...props
}: FilterPillProps) {
 return (
 <button
 data-slot="filter-pill"
 className={cn(
 "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
 active
 ? "bg-brand text-brand-foreground"
 : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
 className
 )}
 {...props}
 />
 )
}

export { FilterBar, FilterGroup, FilterPill }
