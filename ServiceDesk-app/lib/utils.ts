import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from 'date-fns'
import { TaskStatus, StockStatus, UserRole, TaskPriority, TaskType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export const formatDate = (date: string | Date, formatStr: string = 'PPpp') => {
  return format(new Date(date), formatStr)
}

export const formatTimeAgo = (date: string | Date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const formatTime = (date: string | Date) => {
  return format(new Date(date), 'HH:mm')
}

// Status badge colors
export const getTaskStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'scheduled':
      return 'bg-info-soft text-info border-info/20'
    case 'in_progress':
      return 'bg-brand-soft text-brand border-brand-border'
    case 'completed':
    case 'done':
      return 'bg-success-soft text-success border-success/20'
    case 'overdue':
    case 'late':
      return 'bg-destructive-soft text-destructive border-destructive/20'
    case 'pending':
      return 'bg-muted text-foreground border-border'
    case 'stock_issue':
      return 'bg-warning-soft text-warning border-warning/20'
    default:
      return 'bg-muted text-foreground border-border'
  }
}

export const getTaskPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'critical':
      return 'bg-destructive-soft text-destructive border-destructive/20'
    case 'high':
      return 'bg-warning-soft text-warning border-warning/20'
    case 'medium':
      return 'bg-brand-soft text-brand border-brand-border'
    case 'low':
      return 'bg-muted text-foreground border-border'
    default:
      return 'bg-muted text-foreground border-border'
  }
}

export const getTaskTypeLabel = (type: TaskType): string => {
  switch (type) {
    case 'red_alert':
      return '🚨 Red Alert'
    case 'medium':
      return 'Medium'
    case 'daily_recurring':
      return '📅 Daily'
    case 'weekly_recurring':
      return '📆 Weekly'
    case 'on_demand':
      return '⚡ On Demand'
    default:
      return type
  }
}

export const getStockStatusColor = (status: StockStatus): string => {
  switch (status) {
    case 'in_stock':
      return 'bg-success-soft text-success border-success/20'
    case 'low_stock':
      return 'bg-warning-soft text-warning border-warning/20'
    case 'out_of_stock':
      return 'bg-destructive-soft text-destructive border-destructive/20'
    default:
      return 'bg-muted text-foreground border-border'
  }
}

// Role utilities
export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'prep':
      return 'Prep Staff'
    case 'supervisor':
      return 'Supervisor'
    case 'manager':
      return 'Manager'
    default:
      return role
  }
}

export const canEditTask = (role: UserRole): boolean => {
  return role === 'supervisor' || role === 'manager'
}

export const canManageInventory = (role: UserRole): boolean => {
  return role === 'supervisor' || role === 'manager'
}

export const canViewReports = (role: UserRole): boolean => {
  return role === 'supervisor' || role === 'manager'
}

export const canManageUsers = (role: UserRole): boolean => {
  return role === 'manager'
}

// Time formatting
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
