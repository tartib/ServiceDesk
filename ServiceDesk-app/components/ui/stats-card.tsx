import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type StatsCardTone =
 | "brand"
 | "destructive"
 | "success"
 | "warning"
 | "info"
 | "neutral"

type StatsCardTrend = "up" | "down" | "neutral"

const toneIconBg: Record<StatsCardTone, string> = {
 brand: "bg-brand-soft text-brand",
 destructive: "bg-destructive-soft text-destructive",
 success: "bg-success-soft text-success",
 warning: "bg-warning-soft text-warning",
 info: "bg-info-soft text-info",
 neutral: "bg-muted text-muted-foreground",
}

const trendConfig: Record<StatsCardTrend, { icon: LucideIcon; className: string }> = {
 up: { icon: ArrowUp, className: "text-success" },
 down: { icon: ArrowDown, className: "text-destructive" },
 neutral: { icon: Minus, className: "text-muted-foreground" },
}

interface StatsCardProps extends React.ComponentProps<typeof Card> {
 label: string
 value: string | number
 icon?: LucideIcon
 iconClassName?: string
 valueClassName?: string
 description?: string
 tone?: StatsCardTone
 trend?: StatsCardTrend
 trendLabel?: string
}

function StatsCard({
 label,
 value,
 icon: Icon,
 iconClassName,
 valueClassName,
 description,
 tone,
 trend,
 trendLabel,
 className,
 ...props
}: StatsCardProps) {
 const TrendIcon = trend ? trendConfig[trend].icon : null

 return (
 <Card
 className={cn("gap-0 py-4 px-4 sm:px-5", className)}
 {...props}
 >
 <div className="flex items-center justify-between gap-3">
 <div className="min-w-0">
 <p className="text-sm text-muted-foreground truncate">{label}</p>
 <div className="flex items-baseline gap-2 mt-1">
 <p
 className={cn(
 "text-2xl font-bold text-foreground",
 valueClassName
 )}
 >
 {value}
 </p>
 {trend && TrendIcon && (
 <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", trendConfig[trend].className)}>
 <TrendIcon className="h-3 w-3" />
 {trendLabel}
 </span>
 )}
 </div>
 {description && (
 <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
 )}
 </div>
 {Icon && (
 <div
 className={cn(
 "shrink-0 flex items-center justify-center rounded-lg p-2",
 tone ? toneIconBg[tone] : "bg-muted",
 iconClassName
 )}
 >
 <Icon className="h-5 w-5" />
 </div>
 )}
 </div>
 </Card>
 )
}

export { StatsCard }
export type { StatsCardProps, StatsCardTone, StatsCardTrend }
