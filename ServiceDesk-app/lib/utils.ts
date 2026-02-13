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
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'completed':
    case 'done':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'overdue':
    case 'late':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'pending':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'stock_issue':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const getTaskPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
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
      return 'bg-green-100 text-green-800 border-green-200'
    case 'low_stock':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'out_of_stock':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
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
