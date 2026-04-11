import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg"
  label?: string
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
}

function LoadingSpinner({
  size = "md",
  label,
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      data-slot="loading-spinner"
      className={cn("flex flex-col items-center justify-center gap-2", className)}
      {...props}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-primary/30 border-t-primary",
          sizeClasses[size]
        )}
      />
      {label && (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
    </div>
  )
}

export { LoadingSpinner }
