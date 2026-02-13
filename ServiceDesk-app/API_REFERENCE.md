# API Reference - Quick Guide

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

## Response Format

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Endpoints Summary

### Auth
| Method | Endpoint | Auth | Body | Returns |
|--------|----------|------|------|---------|
| POST | `/auth/register` | No | `{ name, email, password, role }` | `{ user, token }` |
| POST | `/auth/login` | No | `{ email, password }` | `{ user, token }` |
| GET | `/auth/me` | Yes | - | `user` |
| PATCH | `/auth/profile` | Yes | `{ name?, email? }` | `user` |
| PATCH | `/auth/password` | Yes | `{ currentPassword, newPassword }` | `success` |

### Tasks
| Method | Endpoint | Auth | Role | Returns |
|--------|----------|------|------|---------|
| GET | `/tasks/today` | Yes | All | `Task[]` |
| GET | `/tasks/my-tasks` | Yes | All | `Task[]` |
| GET | `/tasks/status/:status` | Yes | All | `Task[]` |
| GET | `/tasks/:id` | Yes | All | `Task` |
| PATCH | `/tasks/:id/assign` | Yes | Sup/Mgr | `Task` |
| PATCH | `/tasks/:id/start` | Yes | All | `Task` |
| PATCH | `/tasks/:id/complete` | Yes | All | `Task` |
| PATCH | `/tasks/:id/usage` | Yes | Sup/Mgr | `Task` |


### Inventory
| Method | Endpoint | Auth | Role | Returns |
|--------|----------|------|------|---------|
| GET | `/inventory` | Yes | All | `InventoryItem[]` |
| GET | `/inventory/low-stock` | Yes | All | `InventoryItem[]` |
| GET | `/inventory/:id` | Yes | All | `InventoryItem` |
| POST | `/inventory` | Yes | Manager | `InventoryItem` |
| PATCH | `/inventory/:id` | Yes | Sup/Mgr | `InventoryItem` |
| PATCH | `/inventory/:id/restock` | Yes | Sup/Mgr | `InventoryItem` |

### Categories
| Method | Endpoint | Auth | Role | Returns |
|--------|----------|------|------|---------|
| GET | `/categories` | Yes | All | `Category[]` |
| GET | `/categories?isActive=true` | Yes | All | `Category[]` (active only) |
| GET | `/categories/:id` | Yes | All | `Category` |
| POST | `/categories` | Yes | Manager | `Category` |
| PUT | `/categories/:id` | Yes | Manager | `Category` |
| DELETE | `/categories/:id` | Yes | Manager | Soft delete (deactivate) |
| DELETE | `/categories/:id/permanent` | Yes | Manager | Hard delete (permanent) |

**Create Category Example:**
```json
POST /api/v1/categories
{
  "name": "Appetizers",
  "nameAr": "مقبلات",
  "description": "Starter dishes"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Category created successfully",
  "data": {
    "category": {
      "_id": "...",
      "name": "Appetizers",
      "nameAr": "مقبلات",
      "description": "Starter dishes",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Update Category Example:**
```json
PUT /api/v1/categories/:id
{
  "name": "Main Dishes",
  "description": "Updated description"
}
```

## Data Types

### User
```typescript
{
  id: string
  name: string
  email: string
  role: 'prep' | 'supervisor' | 'manager'
  createdAt: string
  updatedAt: string
}
```

### Task
```typescript
{
  id: string
  productId: string
  productName: string
  scheduledTime: string (ISO 8601)
  prepTimeMinutes: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'late'
  assignedUserId?: string
  assignedUserName?: string
  startedAt?: string
  completedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
```

### Category
```typescript
{
  id: string
  name: string          // English name
  nameAr: string        // Arabic name
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

**Note:** Product categories are now dynamic (free-text strings validated against database categories), not hardcoded enums.

### Product
```typescript
{
  id: string
  name: string
  category: string      // Free-text category (validated against database)
  description?: string
  prepTimeMinutes: number
  prepIntervalHours: number
  requiredIngredients: Array<{
    itemId: string
    quantity: number
    unit: string
  }>
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}
```

### InventoryItem
```typescript
{
  id: string
  name: string
  category: string
  unit: string
  currentQuantity: number
  minThreshold: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  lastUpdated: string
  createdAt: string
  updatedAt: string
}
```

## Query Parameters

### GET /products
- `search` - Search by name
- `isActive` - Filter by active status
- `category` - Filter by category

Example: `/products?search=pizza&isActive=true`

## Role Abbreviations
- **Sup/Mgr**: Supervisor or Manager
- **All**: All authenticated users
