import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const priorityBadgeVariants = cva(
 "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
 {
 variants: {
 priority: {
 critical:
 "border-transparent bg-destructive-soft text-destructive",
 high:
 "border-transparent bg-warning-soft text-warning",
 medium:
 "border-transparent bg-brand-soft text-brand",
 low:
 "border-transparent bg-muted text-muted-foreground",
 trivial:
 "border-transparent bg-muted text-muted-foreground",
 },
 },
 defaultVariants: {
 priority: "medium",
 },
 }
)

function PriorityBadge({
 className,
 priority,
 ...props
}: React.ComponentProps<"span"> & VariantProps<typeof priorityBadgeVariants>) {
 return (
 <span
 data-slot="priority-badge"
 className={cn(priorityBadgeVariants({ priority }), className)}
 {...props}
 />
 )
}

export { PriorityBadge, priorityBadgeVariants }
