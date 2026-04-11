import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps extends React.ComponentProps<typeof Card> {
  label: string
  value: string | number
  icon?: LucideIcon
  iconClassName?: string
  valueClassName?: string
  description?: string
}

function StatsCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  valueClassName,
  description,
  className,
  ...props
}: StatsCardProps) {
  return (
    <Card
      className={cn("gap-0 py-4 px-4 sm:px-5", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <p
            className={cn(
              "text-2xl font-bold text-foreground mt-1",
              valueClassName
            )}
          >
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "shrink-0 flex items-center justify-center rounded-lg p-2 bg-muted",
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
export type { StatsCardProps }
