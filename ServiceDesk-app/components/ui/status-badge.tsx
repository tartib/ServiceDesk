import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        success:
          "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
        danger:
          "border-transparent bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
        info:
          "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
        neutral:
          "border-transparent bg-muted text-muted-foreground",
        purple:
          "border-transparent bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
        orange:
          "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
        cyan:
          "border-transparent bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400",
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
