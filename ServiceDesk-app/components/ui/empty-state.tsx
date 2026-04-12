import * as React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

type EmptyStateVariant = "default" | "compact"
type EmptyStateTone = "brand" | "destructive" | "success" | "warning" | "info" | "neutral"

const toneIconColors: Record<EmptyStateTone, string> = {
 brand: "text-muted-foreground",
 destructive: "text-destructive/50",
 success: "text-success/50",
 warning: "text-warning/50",
 info: "text-info/50",
 neutral: "text-muted-foreground/50",
}

interface EmptyStateProps extends React.ComponentProps<"div"> {
 icon?: LucideIcon
 title?: string
 description?: string
 action?: React.ReactNode
 variant?: EmptyStateVariant
 tone?: EmptyStateTone
}

function EmptyState({
 icon: Icon,
 title,
 description,
 action,
 variant = "default",
 tone = "neutral",
 className,
 children,
 ...props
}: EmptyStateProps) {
 const isCompact = variant === "compact"

 return (
 <div
 data-slot="empty-state"
 className={cn(
 "flex flex-col items-center justify-center text-center",
 isCompact ? "py-6 px-3" : "py-12 px-4",
 className
 )}
 {...props}
 >
 {Icon && (
 <Icon
 className={cn(
 isCompact ? "h-8 w-8 mb-2" : "h-12 w-12 mb-4",
 toneIconColors[tone]
 )}
 />
 )}
 {title && (
 <h3
 className={cn(
 "font-medium text-foreground mb-1",
 isCompact ? "text-sm" : "text-lg"
 )}
 >
 {title}
 </h3>
 )}
 {description && (
 <p
 className={cn(
 "text-muted-foreground mb-4",
 isCompact ? "text-xs max-w-xs" : "text-sm max-w-sm"
 )}
 >
 {description}
 </p>
 )}
 {action}
 {children}
 </div>
 )
}

export { EmptyState }
export type { EmptyStateProps, EmptyStateVariant, EmptyStateTone }
