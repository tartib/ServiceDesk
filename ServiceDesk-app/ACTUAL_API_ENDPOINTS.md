# ✅ Actual Backend API Endpoints

## API Base URL
```
http://localhost:5000/api/v1
```

## Authentication
All authenticated endpoints require the `Authorization` header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📋 Task Endpoints

### Public Endpoints (All Authenticated Users)

#### Get Today's Tasks
```bash
GET /api/v1/tasks/today
Authorization: Bearer TOKEN
```
Returns all tasks scheduled for today.

#### Get My Tasks
```bash
GET /api/v1/tasks/my-tasks
Authorization: Bearer TOKEN
```
Returns tasks assigned to the current user.

#### Get Tasks by Status
```bash
GET /api/v1/tasks/status/:status
Authorization: Bearer TOKEN
```
**Parameters:**
- `status`: `scheduled`, `in_progress`, `completed`, `overdue`, `pending`

#### Get Tasks by Product
```bash
GET /api/v1/tasks/product/:productId
Authorization: Bearer TOKEN
```

#### Get Single Task
```bash
GET /api/v1/tasks/:taskId
Authorization: Bearer TOKEN
```

#### Start Task
```bash
PATCH /api/v1/tasks/:taskId/start
Authorization: Bearer TOKEN
```
Marks a task as in progress.

#### Complete Task
```bash
PATCH /api/v1/tasks/:taskId/complete
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "notes": "Optional completion notes"
}
```

### Manager/Supervisor Only Endpoints

#### Get All Tasks
```bash
GET /api/v1/tasks/all
Authorization: Bearer TOKEN
```
**Requires:** `manager` or `supervisor` role

#### Create Task
```bash
POST /api/v1/tasks
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "productId": "64abc123",
  "scheduledAt": "2024-12-08T10:00:00Z",
  "assignedTo": "64user123",
  "assignedToName": "John Doe",
  "notes": "Optional notes"
}
```
**Requires:** `manager` or `supervisor` role

#### Assign Task
```bash
PATCH /api/v1/tasks/:taskId/assign
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "userId": "64user123"
}
```
**Requires:** `manager` or `supervisor` role

#### Mark Task as Late
```bash
PATCH /api/v1/tasks/:taskId/late
Authorization: Bearer TOKEN
```
**Requires:** `manager` or `supervisor` role

#### Update Task Usage
```bash
PATCH /api/v1/tasks/:taskId/usage
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "inventoryUsage": [
    {
      "itemId": "64item123",
      "quantity": 2.5,
      "unit": "kg"
    }
  ]
}
```
**Requires:** `manager` or `supervisor` role

## 🔐 Auth Endpoints

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john.manager@test.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "6930be7de4d348e731a1a94e",
      "name": "John Manager",
      "email": "john.manager@test.com",
      "role": "manager"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 📊 Available Hooks

### Query Hooks (GET)
```typescript
import {
  useAllTasks,        // GET /tasks/all (managers only)
  useTodayTasks,      // GET /tasks/today
  useMyTasks,         // GET /tasks/my-tasks
  useTasksByStatus,   // GET /tasks/status/:status
  useProductTasks,    // GET /tasks/product/:id
  useTask,            // GET /tasks/:id
} from '@/hooks/useTasks';
```

### Mutation Hooks (POST/PATCH)
```typescript
import {
  useCreateTask,      // POST /tasks
  useStartTask,       // PATCH /tasks/:id/start
  useCompleteTask,    // PATCH /tasks/:id/complete
  useAssignTask,      // PATCH /tasks/:id/assign
  useMarkTaskLate,    // PATCH /tasks/:id/late
  useUpdateTaskUsage, // PATCH /tasks/:id/usage
} from '@/hooks/useTasks';
```

## 🧪 Testing Commands

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.manager@test.com",
    "password": "password123"
  }'
```

### Get All Tasks (Manager)
```bash
curl http://localhost:5000/api/v1/tasks/all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Today's Tasks
```bash
curl http://localhost:5000/api/v1/tasks/today \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get My Tasks
```bash
curl http://localhost:5000/api/v1/tasks/my-tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Start Task
```bash
curl -X PATCH http://localhost:5000/api/v1/tasks/TASK_ID/start \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Complete Task
```bash
curl -X PATCH http://localhost:5000/api/v1/tasks/TASK_ID/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Task completed successfully"}'
```

## 🎯 Hook Usage Examples

### Get Today's Tasks
```typescript
const { data: tasks, isLoading } = useTodayTasks();
```

### Get My Tasks
```typescript
const { data: myTasks, isLoading } = useMyTasks();
```

### Start a Task
```typescript
const { mutate: startTask, isPending } = useStartTask();

// Usage
startTask(taskId);
```

### Complete a Task
```typescript
const { mutate: completeTask, isPending } = useCompleteTask();

// Usage
completeTask({ 
  taskId: "64task123", 
  notes: "Completed successfully" 
});
```

### Create a Task (Manager)
```typescript
const { mutate: createTask, isPending } = useCreateTask();

// Usage
createTask({
  productId: "64product123",
  scheduledAt: "2024-12-08T10:00:00Z",
  assignedTo: "64user123",
  assignedToName: "John Doe",
  notes: "Important task"
});
```

## ✅ Updated Components

### TaskCard
- ✅ Uses `useStartTask()` - calls `PATCH /tasks/:id/start`
- ✅ Uses `useCompleteTask()` - calls `PATCH /tasks/:id/complete`
- ✅ Simplified to direct completion (no dialog)

### Dashboard Page
- ✅ Uses `useTodayTasks()` - displays today's tasks
- ✅ Filters tasks by status locally

### My Tasks Page
- ✅ Uses `useMyTasks()` - gets user's assigned tasks
- ✅ Groups by status (in progress, scheduled, completed, overdue)

### All Tasks Page
- ✅ Uses `useAllTasks()` - for managers/supervisors
- ✅ Filters and displays all tasks

## 🔧 Environment Setup

Update `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## 📝 Notes

- Backend uses `/api/v1` not `/api`
- Task mutations use `PATCH` not `POST`
- Start task does not require userId (taken from JWT)
- Complete task accepts optional `notes` field
- All endpoints return standardized response format with `success`, `statusCode`, `message`, and `data`
