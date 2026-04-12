import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
 "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
 {
 variants: {
 variant: {
 success:
 "border-transparent bg-success-soft text-success",
 warning:
 "border-transparent bg-warning-soft text-warning",
 danger:
 "border-transparent bg-destructive-soft text-destructive",
 info:
 "border-transparent bg-info-soft text-info",
 neutral:
 "border-transparent bg-muted text-muted-foreground",
 brand:
 "border-transparent bg-brand-soft text-brand",
 outline:
 "border-border text-foreground bg-transparent",
 },
 },
 defaultVariants: {
 variant: "neutral",
 },
 }
)

function StatusBadge({
 className,
 variant,
 ...props
}: React.ComponentProps<"span"> & VariantProps<typeof statusBadgeVariants>) {
 return (
 <span
 data-slot="status-badge"
 className={cn(statusBadgeVariants({ variant }), className)}
 {...props}
 />
 )
}

export { StatusBadge, statusBadgeVariants }
