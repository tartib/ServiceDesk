# 📚 API Documentation - نظام إدارة المهام

## Base URL
```
http://localhost:5000/api
```

## Authentication
جميع الـ endpoints تتطلب JWT Token في الـ headers:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Tasks APIs

### 1. Create Task
إنشاء مهمة جديدة

**Endpoint:**
```
POST /api/tasks
```

**Request Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "productId": "64abc123def456789",
  "scheduledAt": "2024-12-10T10:00:00Z",
  "taskType": "red_alert",
  "priority": "critical",
  "assignedTo": "64user123456789",
  "assignedToName": "أحمد محمد",
  "assignmentType": "specific_user",
  "notes": "طلب VIP عاجل",
  "tags": ["vip", "urgent", "breakfast"]
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| productId | string | ✅ | معرف المنتج |
| scheduledAt | ISO Date | ✅ | موعد بدء المهمة |
| taskType | enum | ✅ | نوع المهمة: `red_alert`, `medium`, `daily_recurring`, `weekly_recurring`, `on_demand` |
| priority | enum | ❌ | الأولوية: `critical`, `high`, `medium`, `low` (افتراضي: `medium`) |
| assignedTo | string | ❌ | معرف الموظف المعين |
| assignedToName | string | ❌ | اسم الموظف |
| assignmentType | enum | ❌ | نوع التعيين: `specific_user`, `any_team_member` (افتراضي: `specific_user`) |
| notes | string | ❌ | ملاحظات (حد أقصى 1000 حرف) |
| tags | array | ❌ | وسوم للتصنيف |

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "64task123456789",
    "productId": {
      "_id": "64abc123def456789",
      "name": "بيتزا مارغريتا",
      "category": "Main Dishes"
    },
    "productName": "بيتزا مارغريتا",
    "scheduledAt": "2024-12-10T10:00:00.000Z",
    "dueAt": "2024-12-10T10:10:00.000Z",
    "taskType": "red_alert",
    "priority": "critical",
    "assignedTo": {
      "_id": "64user123456789",
      "name": "أحمد محمد",
      "email": "ahmed@example.com"
    },
    "assignedToName": "أحمد محمد",
    "assignmentType": "specific_user",
    "status": "scheduled",
    "prepTimeMinutes": 30,
    "estimatedDuration": 10,
    "isOverdue": false,
    "isEscalated": false,
    "isRecurring": false,
    "notes": "طلب VIP عاجل",
    "tags": ["vip", "urgent", "breakfast"],
    "timeRemaining": 600,
    "createdAt": "2024-12-08T05:00:00.000Z",
    "updatedAt": "2024-12-08T05:00:00.000Z"
  }
}
```

---

### 2. Get All Tasks
جلب جميع المهام (آخر 100 مهمة)

**Endpoint:**
```
GET /api/tasks
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64task123456789",
      "productName": "بيتزا مارغريتا",
      "scheduledAt": "2024-12-10T10:00:00.000Z",
      "dueAt": "2024-12-10T10:10:00.000Z",
      "taskType": "red_alert",
      "priority": "critical",
      "status": "scheduled",
      "assignedToName": "أحمد محمد",
      "timeRemaining": 600,
      "createdAt": "2024-12-08T05:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get Today Tasks
جلب مهام اليوم فقط

**Endpoint:**
```
GET /api/tasks/today
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64task123",
      "productName": "بيتزا مارغريتا",
      "scheduledAt": "2024-12-08T08:00:00.000Z",
      "dueAt": "2024-12-08T12:00:00.000Z",
      "taskType": "medium",
      "priority": "high",
      "status": "in_progress",
      "assignedTo": {
        "_id": "64user123",
        "name": "أحمد محمد",
        "email": "ahmed@example.com"
      },
      "startedAt": "2024-12-08T08:05:00.000Z",
      "timeRemaining": 235
    }
  ],
  "count": 1,
  "date": "2024-12-08"
}
```

---

### 4. Get Weekly Tasks
جلب مهام الأسبوع الحالي

**Endpoint:**
```
GET /api/tasks/weekly
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64task1",
      "productName": "معجنات صباحية",
      "scheduledAt": "2024-12-08T06:00:00.000Z",
      "status": "completed",
      "priority": "high"
    },
    {
      "_id": "64task2",
      "productName": "سلطة يونانية",
      "scheduledAt": "2024-12-09T11:00:00.000Z",
      "status": "scheduled",
      "priority": "medium"
    }
  ],
  "count": 2,
  "weekStart": "2024-12-08",
  "weekEnd": "2024-12-14"
}
```

---

### 5. Get Urgent Tasks
جلب المهام الفورية والعاجلة

**Endpoint:**
```
GET /api/tasks/urgent
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64task1",
      "productName": "طلب VIP",
      "taskType": "red_alert",
      "priority": "critical",
      "status": "scheduled",
      "dueAt": "2024-12-08T08:30:00.000Z",
      "timeRemaining": 15,
      "assignedToName": "سارة أحمد"
    },
    {
      "_id": "64task2",
      "productName": "مهمة متأخرة",
      "priority": "high",
      "status": "overdue",
      "isOverdue": true,
      "dueAt": "2024-12-08T07:00:00.000Z"
    }
  ],
  "count": 2
}
```

---

### 6. Get Kanban Tasks
جلب المهام لعرض Kanban

**Endpoint:**
```
GET /api/tasks/kanban
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pending": [
      {
        "_id": "64task1",
        "productName": "بيتزا مارغريتا",
        "priority": "high",
        "scheduledAt": "2024-12-08T10:00:00.000Z",
        "assignedToName": "أحمد محمد"
      }
    ],
    "inProgress": [
      {
        "_id": "64task2",
        "productName": "معكرونة كاربونارا",
        "priority": "medium",
        "startedAt": "2024-12-08T08:00:00.000Z",
        "assignedToName": "سارة أحمد",
        "timeRemaining": 45
      }
    ],
    "done": [
      {
        "_id": "64task3",
        "productName": "سلطة سيزر",
        "priority": "low",
        "completedAt": "2024-12-08T07:30:00.000Z",
        "assignedToName": "محمد علي",
        "completionScore": 5,
        "performanceScore": 100
      }
    ]
  },
  "counts": {
    "pending": 1,
    "inProgress": 1,
    "done": 1
  }
}
```

---

### 7. Get Task by ID
جلب تفاصيل مهمة معينة

**Endpoint:**
```
GET /api/tasks/:taskId
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64task123456789",
    "productId": {
      "_id": "64abc123",
      "name": "بيتزا مارغريتا",
      "category": "Main Dishes",
      "prepTimeMinutes": 30,
      "ingredients": [
        {
          "name": "عجينة بيتزا",
          "quantity": 1,
          "unit": "pcs"
        }
      ]
    },
    "productName": "بيتزا مارغريتا",
    "assignedTo": {
      "_id": "64user123",
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "role": "prep"
    },
    "assignedToName": "أحمد محمد",
    "assignmentType": "specific_user",
    "status": "in_progress",
    "taskType": "medium",
    "priority": "high",
    "scheduledAt": "2024-12-08T08:00:00.000Z",
    "dueAt": "2024-12-08T12:00:00.000Z",
    "startedAt": "2024-12-08T08:05:00.000Z",
    "prepTimeMinutes": 30,
    "estimatedDuration": 240,
    "isOverdue": false,
    "isEscalated": false,
    "isRecurring": false,
    "notes": "تحضير للغداء",
    "tags": ["lunch", "popular"],
    "timeRemaining": 235,
    "performanceScore": null,
    "createdAt": "2024-12-07T10:00:00.000Z",
    "updatedAt": "2024-12-08T08:05:00.000Z"
  }
}
```

---

### 8. Start Task
بدء تنفيذ مهمة

**Endpoint:**
```
POST /api/tasks/:taskId/start
```

**Request Body:**
```json
{
  "userId": "64user123456789"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم بدء المهمة بنجاح",
  "data": {
    "_id": "64task123456789",
    "status": "in_progress",
    "startedAt": "2024-12-08T08:15:00.000Z",
    "productName": "بيتزا مارغريتا"
  }
}
```

---

### 9. Complete Task
إكمال مهمة

**Endpoint:**
```
POST /api/tasks/:taskId/complete
```

**Request Body:**
```json
{
  "preparedQuantity": 5,
  "unit": "pcs",
  "notes": "تم التحضير بنجاح بجودة عالية"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم إكمال المهمة بنجاح",
  "data": {
    "_id": "64task123456789",
    "status": "completed",
    "completedAt": "2024-12-08T08:45:00.000Z",
    "startedAt": "2024-12-08T08:15:00.000Z",
    "actualDuration": 30,
    "estimatedDuration": 30,
    "preparedQuantity": 5,
    "unit": "pcs",
    "performanceScore": 100,
    "productName": "بيتزا مارغريتا"
  }
}
```

---

### 10. Rate Task
تقييم إنجاز مهمة

**Endpoint:**
```
POST /api/tasks/:taskId/rate
```

**Request Body:**
```json
{
  "score": 5,
  "userId": "64user123456789"
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| score | number | ✅ | التقييم من 1 إلى 5 |
| userId | string | ✅ | معرف المقيّم |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم تقييم المهمة بنجاح",
  "data": {
    "_id": "64task123456789",
    "completionScore": 5,
    "productName": "بيتزا مارغريتا"
  }
}
```

---

### 11. Escalate Task
تصعيد مهمة للمدير

**Endpoint:**
```
POST /api/tasks/:taskId/escalate
```

**Request Body:**
```json
{
  "reason": "المهمة متأخرة ولم يتم الرد على التنبيهات"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم تصعيد المهمة للمدير",
  "data": {
    "task": {
      "_id": "64task123456789",
      "isEscalated": true,
      "escalatedAt": "2024-12-08T09:00:00.000Z",
      "escalatedTo": {
        "_id": "64manager123",
        "name": "المدير العام",
        "email": "manager@example.com"
      }
    },
    "notification": {
      "_id": "64notif123",
      "type": "escalation",
      "level": "critical",
      "message": "تم تصعيد المهمة \"بيتزا مارغريتا\". السبب: المهمة متأخرة ولم يتم الرد على التنبيهات"
    }
  }
}
```

---

### 12. Get Overdue Tasks
جلب المهام المتأخرة

**Endpoint:**
```
GET /api/tasks/overdue
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64task1",
      "productName": "سلطة يونانية",
      "dueAt": "2024-12-08T07:00:00.000Z",
      "status": "overdue",
      "isOverdue": true,
      "priority": "high",
      "assignedToName": "أحمد محمد",
      "scheduledAt": "2024-12-08T06:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 13. Get Escalated Tasks
جلب المهام المصعدة

**Endpoint:**
```
GET /api/tasks/escalated
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64task1",
      "productName": "بيتزا مارغريتا",
      "isEscalated": true,
      "escalatedAt": "2024-12-08T09:00:00.000Z",
      "escalatedTo": {
        "_id": "64manager123",
        "name": "المدير العام",
        "email": "manager@example.com"
      },
      "assignedTo": {
        "_id": "64user123",
        "name": "أحمد محمد",
        "email": "ahmed@example.com"
      },
      "status": "overdue",
      "priority": "critical"
    }
  ],
  "count": 1
}
```

---

## 💬 Comments APIs

### 1. Add Comment
إضافة تعليق على مهمة

**Endpoint:**
```
POST /api/tasks/:taskId/comments
```

**Request Body:**
```json
{
  "comment": "تم البدء بالتحضير، الجودة ممتازة",
  "attachments": [
    "https://example.com/images/task1-photo.jpg"
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "64comment123",
    "taskId": "64task123456789",
    "userId": "64user123",
    "userName": "أحمد محمد",
    "comment": "تم البدء بالتحضير، الجودة ممتازة",
    "attachments": [
      "https://example.com/images/task1-photo.jpg"
    ],
    "createdAt": "2024-12-08T08:20:00.000Z",
    "updatedAt": "2024-12-08T08:20:00.000Z"
  }
}
```

---

### 2. Get Task Comments
جلب جميع تعليقات مهمة

**Endpoint:**
```
GET /api/tasks/:taskId/comments
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64comment1",
      "userId": {
        "_id": "64user123",
        "name": "أحمد محمد",
        "email": "ahmed@example.com"
      },
      "userName": "أحمد محمد",
      "comment": "تم البدء بالتحضير، الجودة ممتازة",
      "attachments": [],
      "createdAt": "2024-12-08T08:20:00.000Z"
    },
    {
      "_id": "64comment2",
      "userName": "المدير العام",
      "comment": "عمل ممتاز، استمر",
      "createdAt": "2024-12-08T08:25:00.000Z"
    }
  ],
  "count": 2
}
```

---

### 3. Update Comment
تحديث تعليق

**Endpoint:**
```
PUT /api/comments/:commentId
```

**Request Body:**
```json
{
  "comment": "تم البدء بالتحضير، الجودة ممتازة جداً - تحديث"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم تحديث التعليق بنجاح",
  "data": {
    "_id": "64comment123",
    "comment": "تم البدء بالتحضير، الجودة ممتازة جداً - تحديث",
    "updatedAt": "2024-12-08T08:30:00.000Z"
  }
}
```

---

### 4. Delete Comment
حذف تعليق

**Endpoint:**
```
DELETE /api/comments/:commentId
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم حذف التعليق بنجاح"
}
```

---

## 📝 Execution Log APIs

### 1. Get Task Execution Log
جلب سجل تنفيذ مهمة معينة

**Endpoint:**
```
GET /api/tasks/:taskId/execution-log
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 50 | عدد السجلات (حد أقصى) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64log1",
      "taskId": "64task123",
      "userId": {
        "_id": "64user123",
        "name": "أحمد محمد",
        "email": "ahmed@example.com"
      },
      "userName": "أحمد محمد",
      "action": "created",
      "oldStatus": null,
      "newStatus": "scheduled",
      "details": "تم إنشاء مهمة جديدة: بيتزا مارغريتا",
      "metadata": {
        "taskType": "medium",
        "priority": "high"
      },
      "createdAt": "2024-12-08T07:00:00.000Z"
    },
    {
      "_id": "64log2",
      "action": "started",
      "oldStatus": "scheduled",
      "newStatus": "in_progress",
      "details": "تم بدء المهمة",
      "createdAt": "2024-12-08T08:00:00.000Z"
    },
    {
      "_id": "64log3",
      "action": "completed",
      "oldStatus": "in_progress",
      "newStatus": "completed",
      "details": "تم إكمال المهمة بنجاح",
      "createdAt": "2024-12-08T08:30:00.000Z"
    }
  ],
  "count": 3
}
```

---

### 2. Get User Execution Log
جلب سجل نشاطات مستخدم معين

**Endpoint:**
```
GET /api/users/:userId/execution-log
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64log1",
      "taskId": {
        "_id": "64task123",
        "productName": "بيتزا مارغريتا",
        "status": "completed",
        "priority": "high"
      },
      "action": "completed",
      "details": "تم إكمال المهمة بنجاح",
      "createdAt": "2024-12-08T08:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get Recent Activity
جلب آخر الأنشطة في النظام

**Endpoint:**
```
GET /api/execution-log/recent
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 20 | عدد السجلات |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64log1",
      "userId": {
        "name": "أحمد محمد"
      },
      "taskId": {
        "productName": "بيتزا مارغريتا",
        "priority": "high"
      },
      "action": "completed",
      "createdAt": "2024-12-08T08:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

## 🔔 Notifications APIs

### 1. Get User Notifications
جلب إشعارات المستخدم

**Endpoint:**
```
GET /api/notifications
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| isRead | boolean | تصفية حسب حالة القراءة (optional) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64notif1",
      "type": "before_due",
      "level": "info",
      "priority": "high",
      "title": "تنبيه: مهمة قريبة",
      "message": "ستبدأ مهمة \"بيتزا مارغريتا\" خلال 30 دقيقة",
      "relatedTaskId": {
        "_id": "64task123",
        "productName": "بيتزا مارغريتا",
        "status": "scheduled"
      },
      "isRead": false,
      "isEscalation": false,
      "actionRequired": true,
      "actionUrl": "/tasks/64task123",
      "sentAt": "2024-12-08T07:30:00.000Z",
      "createdAt": "2024-12-08T07:30:00.000Z"
    }
  ],
  "count": 1,
  "unreadCount": 1
}
```

---

### 2. Get Unread Notifications
جلب الإشعارات غير المقروءة

**Endpoint:**
```
GET /api/notifications/unread
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64notif1",
      "type": "overdue",
      "level": "warning",
      "title": "تحذير: مهمة متأخرة",
      "message": "المهمة \"سلطة يونانية\" متأخرة عن الموعد المحدد",
      "isRead": false,
      "actionRequired": true,
      "createdAt": "2024-12-08T08:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get Critical Notifications
جلب الإشعارات الحرجة غير المقروءة

**Endpoint:**
```
GET /api/notifications/critical
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64notif1",
      "type": "escalation",
      "level": "critical",
      "priority": "critical",
      "title": "تصعيد: مهمة تحتاج إلى تدخل",
      "message": "تم تصعيد المهمة \"بيتزا مارغريتا\". السبب: تصعيد تلقائي: المهمة متأخرة لأكثر من ساعتين",
      "relatedTaskId": {
        "productName": "بيتزا مارغريتا",
        "status": "overdue",
        "priority": "critical"
      },
      "isRead": false,
      "isEscalation": true,
      "actionRequired": true,
      "actionUrl": "/tasks/64task123",
      "createdAt": "2024-12-08T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 4. Mark Notification as Read
تعليم إشعار كمقروء

**Endpoint:**
```
PUT /api/notifications/:notificationId/read
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم تعليم الإشعار كمقروء",
  "data": {
    "_id": "64notif123",
    "isRead": true,
    "readAt": "2024-12-08T08:15:00.000Z"
  }
}
```

---

### 5. Mark All as Read
تعليم جميع الإشعارات كمقروءة

**Endpoint:**
```
PUT /api/notifications/read-all
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم تعليم جميع الإشعارات كمقروءة",
  "data": {
    "modifiedCount": 5
  }
}
```

---

## 📊 Dashboard APIs

### 1. Get Dashboard Data
جلب بيانات Dashboard الكاملة

**Endpoint:**
```
GET /api/dashboard
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| dateFrom | ISO Date | تاريخ البداية (optional) |
| dateTo | ISO Date | تاريخ النهاية (optional) |

**Example:**
```
GET /api/dashboard?dateFrom=2024-12-01&dateTo=2024-12-31
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalTasks": 150,
      "completedTasks": 135,
      "inProgressTasks": 10,
      "overdueTasks": 3,
      "pendingTasks": 2,
      "completionRate": 90.0,
      "onTimeCompletionRate": 85.19,
      "averageCompletionTime": 28,
      "criticalTasks": 5,
      "escalatedTasks": 2
    },
    "teamPerformance": {
      "totalMembers": 8,
      "activeMembers": 6,
      "tasksPerMember": {
        "64user1": 25,
        "64user2": 20,
        "64user3": 18
      },
      "completionRatePerMember": {
        "64user1": 92.0,
        "64user2": 85.0,
        "64user3": 94.44
      },
      "averagePerformanceScore": 4.3,
      "topPerformers": [
        {
          "userId": "64user3",
          "userName": "سارة أحمد",
          "tasksCompleted": 17,
          "avgScore": 4.8
        },
        {
          "userId": "64user1",
          "userName": "أحمد محمد",
          "tasksCompleted": 23,
          "avgScore": 4.5
        }
      ]
    },
    "taskDistribution": {
      "byType": {
        "red_alert": 15,
        "medium": 80,
        "daily_recurring": 30,
        "weekly_recurring": 20,
        "on_demand": 5
      },
      "byPriority": {
        "critical": 10,
        "high": 45,
        "medium": 70,
        "low": 25
      },
      "byStatus": {
        "scheduled": 2,
        "in_progress": 10,
        "completed": 135,
        "overdue": 3,
        "pending": 0
      }
    },
    "timeAnalysis": {
      "tasksByHour": {
        "6": 15,
        "7": 20,
        "8": 25,
        "9": 18,
        "10": 22
      },
      "tasksByDayOfWeek": {
        "0": 18,
        "1": 25,
        "2": 23,
        "3": 22,
        "4": 20,
        "5": 22,
        "6": 20
      },
      "peakHours": [8, 10, 12],
      "averageTaskDuration": 28,
      "estimatedVsActual": {
        "onTime": 5,
        "delayed": 3,
        "early": 115
      }
    },
    "recentActivity": [
      {
        "id": "64task1",
        "type": "task",
        "action": "completed",
        "taskName": "بيتزا مارغريتا",
        "assignedTo": "أحمد محمد",
        "timestamp": "2024-12-08T08:30:00.000Z",
        "priority": "high"
      }
    ],
    "criticalAlerts": [
      {
        "id": "64task1",
        "type": "overdue",
        "severity": "high",
        "message": "المهمة \"سلطة يونانية\" متأخرة",
        "taskId": "64task1",
        "assignedTo": "محمد علي",
        "timestamp": "2024-12-08T08:00:00.000Z"
      },
      {
        "id": "64task2",
        "type": "escalated",
        "severity": "critical",
        "message": "المهمة \"معكرونة كاربونارا\" تم تصعيدها",
        "taskId": "64task2",
        "assignedTo": "سارة أحمد",
        "timestamp": "2024-12-08T09:00:00.000Z"
      }
    ],
    "trends": {
      "completionRateTrend": 5.23,
      "overdueRateTrend": -2.15
    }
  }
}
```

---

### 2. Get KPIs Only
جلب مؤشرات الأداء فقط

**Endpoint:**
```
GET /api/dashboard/kpis
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| dateFrom | ISO Date | تاريخ البداية |
| dateTo | ISO Date | تاريخ النهاية |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalTasks": 150,
    "completedTasks": 135,
    "inProgressTasks": 10,
    "overdueTasks": 3,
    "pendingTasks": 2,
    "completionRate": 90.0,
    "onTimeCompletionRate": 85.19,
    "averageCompletionTime": 28,
    "criticalTasks": 5,
    "escalatedTasks": 2
  }
}
```

---

### 3. Get Team Performance
جلب أداء الفريق

**Endpoint:**
```
GET /api/dashboard/team-performance
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalMembers": 8,
    "activeMembers": 6,
    "averagePerformanceScore": 4.3,
    "topPerformers": [
      {
        "userId": "64user3",
        "userName": "سارة أحمد",
        "tasksCompleted": 17,
        "avgScore": 4.8
      }
    ]
  }
}
```

---

### 4. Get Critical Alerts
جلب التنبيهات الحرجة

**Endpoint:**
```
GET /api/dashboard/alerts
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64task1",
      "type": "overdue",
      "severity": "high",
      "message": "المهمة \"سلطة يونانية\" متأخرة",
      "taskId": "64task1",
      "assignedTo": "محمد علي",
      "timestamp": "2024-12-08T08:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## 📈 Reports APIs

### 1. Daily Report
التقرير اليومي

**Endpoint:**
```
GET /api/reports/daily
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| date | ISO Date | التاريخ (optional، افتراضي: اليوم) |

**Example:**
```
GET /api/reports/daily?date=2024-12-08
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "date": "2024-12-08T00:00:00.000Z",
    "totalTasks": 25,
    "completedTasks": 22,
    "inProgressTasks": 2,
    "overdueTasks": 1,
    "completionRate": 88.0,
    "averageCompletionTime": 27,
    "tasksByType": {
      "red_alert": 3,
      "medium": 15,
      "daily_recurring": 5,
      "weekly_recurring": 2,
      "on_demand": 0
    },
    "tasksByPriority": {
      "critical": 2,
      "high": 8,
      "medium": 12,
      "low": 3
    },
    "topPerformers": [
      {
        "userId": "64user1",
        "userName": "أحمد محمد",
        "tasksCompleted": 8
      },
      {
        "userId": "64user2",
        "userName": "سارة أحمد",
        "tasksCompleted": 7
      }
    ],
    "delays": 1,
    "earlyCompletions": 21
  }
}
```

---

### 2. Weekly Report
التقرير الأسبوعي

**Endpoint:**
```
GET /api/reports/weekly
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| weekStart | ISO Date | بداية الأسبوع (optional) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "weekStart": "2024-12-08T00:00:00.000Z",
    "weekEnd": "2024-12-14T23:59:59.999Z",
    "totalTasks": 150,
    "completedTasks": 135,
    "completionRate": 90.0,
    "averageCompletionTime": 28,
    "overdueTasks": 5,
    "escalatedTasks": 2,
    "dailyBreakdown": [
      {
        "date": "2024-12-08T00:00:00.000Z",
        "tasks": 25,
        "completed": 22
      },
      {
        "date": "2024-12-09T00:00:00.000Z",
        "tasks": 23,
        "completed": 20
      }
    ],
    "teamPerformance": [
      {
        "userId": "64user1",
        "userName": "أحمد محمد",
        "tasksCompleted": 45,
        "avgScore": 4.5
      },
      {
        "userId": "64user2",
        "userName": "سارة أحمد",
        "tasksCompleted": 40,
        "avgScore": 4.7
      }
    ],
    "trends": {
      "completionRateTrend": 5.23,
      "productivityTrend": 8.5
    }
  }
}
```

---

### 3. Monthly Report
التقرير الشهري

**Endpoint:**
```
GET /api/reports/monthly
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| month | number | الشهر (1-12) |
| year | number | السنة |

**Example:**
```
GET /api/reports/monthly?month=12&year=2024
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "month": 11,
    "year": 2024,
    "totalTasks": 650,
    "completedTasks": 585,
    "completionRate": 90.0,
    "averageCompletionTime": 28,
    "overdueTasks": 25,
    "escalatedTasks": 8,
    "weeklyBreakdown": [
      {
        "week": 1,
        "tasks": 150,
        "completed": 135
      },
      {
        "week": 2,
        "tasks": 155,
        "completed": 140
      },
      {
        "week": 3,
        "tasks": 160,
        "completed": 145
      },
      {
        "week": 4,
        "tasks": 185,
        "completed": 165
      }
    ],
    "teamPerformance": [
      {
        "userId": "64user1",
        "userName": "أحمد محمد",
        "tasksCompleted": 180,
        "avgScore": 4.5,
        "hoursWorked": 168.5
      },
      {
        "userId": "64user2",
        "userName": "سارة أحمد",
        "tasksCompleted": 165,
        "avgScore": 4.7,
        "hoursWorked": 155.25
      }
    ],
    "insights": {
      "bestDay": "Mon Dec 16 2024",
      "worstDay": "Sat Dec 07 2024",
      "peakHours": [8, 10, 12],
      "improvementAreas": [
        "نسبة عالية من المهام المتأخرة"
      ]
    }
  }
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "بيانات غير صحيحة",
    "details": [
      {
        "field": "taskType",
        "message": "نوع المهمة مطلوب"
      }
    ]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "يرجى تسجيل الدخول أولاً"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "ليس لديك صلاحية لتنفيذ هذا الإجراء"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "المهمة غير موجودة"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "حدث خطأ في الخادم، يرجى المحاولة لاحقاً"
  }
}
```

---

## 📝 Notes

### Date Format
جميع التواريخ بصيغة ISO 8601:
```
2024-12-08T08:00:00.000Z
```

### Pagination
معظم الـ endpoints التي تعيد قوائم تدعم pagination:
```
GET /api/tasks?page=1&limit=20
```

### Filtering
يمكن تصفية النتائج باستخدام query parameters:
```
GET /api/tasks?status=in_progress&priority=high
```

### Sorting
يمكن ترتيب النتائج:
```
GET /api/tasks?sortBy=dueAt&order=asc
```

---

## 🔐 Authentication Example

### Login
```
POST /api/auth/login
{
  "email": "ahmed@example.com",
  "password": "password123"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "64user123",
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "role": "prep"
    }
  }
}
```

### Using Token
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

تم توثيق جميع الـ APIs بالكامل! 🎉
