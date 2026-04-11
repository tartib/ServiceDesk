import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const priorityBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      priority: {
        critical:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400",
        high:
          "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400",
        medium:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400",
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
