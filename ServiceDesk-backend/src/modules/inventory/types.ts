/**
 * Inventory Module — Shared Enums & Interfaces
 */

export enum ItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum WarehouseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum LocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum ReceiptStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum BookingStatus {
  ACTIVE = 'active',
  RELEASED = 'released',
  CANCELLED = 'cancelled',
}

export enum TransferStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AdjustmentType {
  INCREASE = 'increase',
  DECREASE = 'decrease',
  SET_BALANCE = 'set_balance',
}

export enum ReturnCondition {
  GOOD = 'good',
  DAMAGED = 'damaged',
}

export enum MovementType {
  RECEIVE = 'receive',
  BOOK = 'book',
  RELEASE_BOOKING = 'release_booking',
  ISSUE = 'issue',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  REVERSAL = 'reversal',
}

export enum StockAlertStatus {
  NORMAL = 'normal',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}
