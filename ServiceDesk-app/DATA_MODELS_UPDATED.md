# ✅ نماذج البيانات المحدثة - Updated Data Models

تم تحديث جميع نماذج البيانات في الـ Frontend لتتطابق **100%** مع الـ Backend.

## 📋 قائمة التحديثات

### 1️⃣ User Model ✅

**الحقول الجديدة:**
```typescript
{
  _id?: string;           // ✅ Added
  isActive: boolean;      // ✅ Added
  fcmToken?: string;      // ✅ Added (for push notifications)
}
```

---

### 2️⃣ Task Model ✅

**TaskStatus المحدث:**
```typescript
export type TaskStatus = 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'overdue' 
  | 'pending' 
  | 'late'
  | 'stock_issue'  // ✅ Added
  | 'done';        // ✅ Added
```

**الحقول الجديدة:**
```typescript
{
  usedQuantity?: number;      // ✅ Added
  waste?: number;             // ✅ Added (virtual field)
  recurringPattern?: string;  // ✅ Added
}
```

---

### 3️⃣ Product Model ✅

**الحقول الجديدة:**
```typescript
{
  _id?: string;        // ✅ Added
  nameAr?: string;     // ✅ Added (Arabic name)
  createdBy?: string;  // ✅ Changed from required to optional
}
```

---

### 4️⃣ Inventory Model ✅

**Enum جديد:**
```typescript
export type InventoryCategory = 
  | 'meat' 
  | 'vegetable' 
  | 'dairy' 
  | 'grain' 
  | 'spice' 
  | 'sauce' 
  | 'other';
```

**الحقول الجديدة:**
```typescript
{
  _id?: string;
  nameAr?: string;             // ✅ Added
  category: InventoryCategory;  // ✅ Type updated
  unit: 'kg' | 'g' | 'l' | ... // ✅ Strict typing
  lastRestocked?: string;       // ✅ Added
  supplier?: string;            // ✅ Added
  cost?: number;                // ✅ Added
  lastUpdated?: string;         // ✅ Added
}
```

---

### 5️⃣ Notification Model ✅

**NotificationType المحدث:**
```typescript
export type NotificationType = 
  | 'reminder'
  | 'start'       // ✅ Added
  | 'late'
  | 'overdue'
  | 'critical'    // ✅ Added
  | 'stock_issue'
  | 'completion'
  | 'escalation'
  | 'before_due';
```

**NotificationLevel المحدث:**
```typescript
export type NotificationLevel = 
  | 'info' 
  | 'warning' 
  | 'error'      // ✅ Added
  | 'critical';
```

**الحقول الجديدة:**
```typescript
{
  userId: string | { _id: string; name: string; email: string };  // ✅ Updated
  relatedTaskId?: string | { ... };    // ✅ Updated
  relatedInventoryId?: string;         // ✅ Added
  scheduledFor?: string;               // ✅ Added
  escalatedFrom?: string;              // ✅ Added
  metadata?: Record<string, any>;      // ✅ Added
}
```

---

### 6️⃣ ExecutionLog Model ✅

**ExecutionAction المحدث:**
```typescript
export type ExecutionAction = 
  | 'created'
  | 'assigned'
  | 'started'
  | 'completed'
  | 'escalated'
  | 'reassigned'   // ✅ Added
  | 'commented'    // ✅ Added
  | 'rated'        // ✅ Added
  | 'updated';     // ✅ Added
```

---

### 7️⃣ DailyReport Model ✅ (Full Restructure)

**البنية الجديدة:**
```typescript
{
  _id?: string;
  id?: string;
  date: string;
  
  // ✅ Changed from flat structure to nested
  taskSummary: {
    totalTasks: number;
    completedTasks: number;
    lateTasks: number;
    inProgressTasks: number;
    stockIssueTasks: number;
  };
  
  // ✅ Enhanced employee performance
  employeePerformance: Array<{
    userId: string;
    userName: string;
    tasksCompleted: number;
    averageCompletionTime: number;
    onTimeCompletions: number;      // ✅ Added
    lateCompletions: number;        // ✅ Added
  }>;
  
  // ✅ New section: Inventory Usage
  inventoryUsage: Array<{
    ingredientId: string;
    ingredientName: string;
    quantityUsed: number;
    unit: string;
  }>;
  
  // ✅ Waste tracking
  totalPrepared: number;
  totalUsed: number;
  totalWaste: number;
  wastePercentage: number;  // 0-100
  
  notes?: string;
  generatedAt: string;      // ✅ Added
  createdAt: string;
  updatedAt: string;
}
```

---

### 8️⃣ AuditLog Model ✅ (NEW!)

**نموذج جديد كلياً:**
```typescript
export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'start_task'
  | 'complete_task'
  | 'inventory_update'
  | 'assign_task'
  | 'comment_add'
  | 'escalate';

export interface AuditLog {
  _id: string;
  id?: string;
  userId?: string | { _id: string; name: string; email: string };
  userName?: string;
  action: AuditAction;
  entity: string;        // Model name
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
```

---

## 🎨 UI Updates

### Status Colors المحدث:

```typescript
getTaskStatusColor(status):
  - 'scheduled'    → Purple
  - 'in_progress'  → Blue
  - 'completed'    → Green
  - 'done'         → Green    ✅ Added
  - 'overdue'      → Red
  - 'late'         → Red
  - 'pending'      → Gray
  - 'stock_issue'  → Orange   ✅ Added
```

---

## 📊 Summary of Changes

| Model | Changes | Status |
|-------|---------|--------|
| User | +3 fields | ✅ Updated |
| Task | +3 fields, +2 statuses | ✅ Updated |
| Product | +2 fields | ✅ Updated |
| Inventory | +6 fields, +1 enum | ✅ Updated |
| Notification | +5 fields, +3 types | ✅ Updated |
| Comment | No changes | ✅ Already OK |
| ExecutionLog | +4 actions | ✅ Updated |
| DailyReport | Full restructure | ✅ Updated |
| AuditLog | NEW model | ✅ Added |
| Category | No changes | ✅ Already OK |

---

## 🔧 Files Modified

1. ✅ `/types/index.ts` - All type definitions updated
2. ✅ `/lib/utils.ts` - Status colors updated
3. ✅ `/hooks/useTasks.ts` - Data extraction fixed
4. ✅ `/components/dashboard/TaskKanban.tsx` - 5-column layout

---

## 🎯 Compatibility Matrix

| Backend Status | Frontend Type | UI Display |
|---------------|---------------|------------|
| `scheduled` | `scheduled` | Purple - Scheduled |
| `in_progress` | `in_progress` | Blue - In Progress |
| `completed` | `completed` | Green - Completed |
| `done` | `done` | Green - Done |
| `late` | `late` | Red - Overdue |
| `overdue` | `overdue` | Red - Overdue |
| `pending` | `pending` | Gray - Pending |
| `stock_issue` | `stock_issue` | Orange - Stock Issue |

---

## ✅ Testing Checklist

- [x] User model with isActive field
- [x] Task statuses: late, stock_issue, done
- [x] Product with nameAr
- [x] Inventory with all new fields
- [x] Notification levels and types
- [x] ExecutionLog actions
- [x] DailyReport new structure
- [x] AuditLog new model
- [x] Status color mapping
- [x] Data extraction from nested API responses

---

## 📝 Notes

- All `_id` fields are properly mapped to `id` for backward compatibility
- All TypeScript types now match 100% with MongoDB schemas
- Virtual fields (like `waste`, `performanceScore`) are included as optional
- Enums are properly typed and exhaustive
- API response handling supports both nested and direct data structures

---

✨ **Frontend is now fully synchronized with Backend!**
