# Frontend Plan - Prep Manager Application

## Overview
React-based web application for restaurant food preparation management with role-based access control.

---

## Tech Stack Recommendations
- **Framework**: React 18+ with TypeScript
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query) + Zustand
- **UI Framework**: TailwindCSS + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client (for notifications)
- **Icons**: Lucide React
- **Charts**: Recharts or Chart.js
- **Date/Time**: date-fns

---

## User Roles & Permissions

| Role | Access Level |
|------|-------------|
| **Prep Staff** | View tasks, start/complete own tasks, view inventory |
| **Supervisor** | All prep staff + assign tasks, manage products, update inventory |
| **Manager** | Full access including user management, reports, system configuration |

---

## Application Routes & Pages

### 🔐 Authentication (Public Routes)

#### 1. Login Page
- **Route**: `/login`
- **API Endpoint**: `POST /api/v1/auth/login`
- **Features**:
  - Email/username and password input
  - Remember me checkbox
  - Forgot password link (future)
  - Error handling and validation
  - Redirect to dashboard on success
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "...", "name": "...", "role": "prep" },
      "token": "jwt_token_here"
    }
  }
  ```

#### 2. Register Page
- **Route**: `/register`
- **API Endpoint**: `POST /api/v1/auth/register`
- **Features**:
  - Full name, email, password, role selection
  - Password confirmation
  - Form validation
  - Auto-login after registration
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "prep"
  }
  ```

---

### 🏠 Dashboard (Protected Routes)

#### 3. Main Dashboard
- **Route**: `/dashboard`
- **API Endpoints**:
  - `GET /api/v1/tasks/today` - Today's tasks overview
  - `GET /api/v1/tasks/my-tasks` - User's assigned tasks
  - `GET /api/v1/inventory/low-stock` - Low stock alerts
- **Features**:
  - **For All Users**:
    - Today's task summary cards (Scheduled, In Progress, Completed, Late)
    - My assigned tasks list
    - Quick action buttons (Start Task, Complete Task)
    - Low stock alerts widget
    - Recent activity feed
  - **For Supervisors/Managers**:
    - Team performance overview
    - Task assignment widget
    - Quick stats (total tasks, completion rate, average prep time)
    - Inventory alerts summary
- **Components**:
  - StatCard (task counts by status)
  - TaskListWidget (upcoming tasks)
  - AlertsWidget (low stock, late tasks)
  - QuickActions (buttons for common actions)

---

### 📋 Tasks Management

#### 4. Today's Tasks Page
- **Route**: `/tasks/today`
- **API Endpoint**: `GET /api/v1/tasks/today`
- **Features**:
  - Filterable task list (All, Scheduled, In Progress, Completed, Late)
  - Sort by time, product name, status
  - Search by product name
  - Task cards with:
    - Product name and image
    - Scheduled time
    - Prep time duration
    - Current status badge
    - Assigned user (if any)
    - Action buttons based on status
  - Bulk actions (Supervisor/Manager only)

#### 5. My Tasks Page
- **Route**: `/tasks/my-tasks`
- **API Endpoint**: `GET /api/v1/tasks/my-tasks`
- **Features**:
  - Personal task queue
  - Start/complete task actions
  - Timer display for in-progress tasks
  - Task history
  - Performance metrics (on-time completion rate)

#### 6. All Tasks Page
- **Route**: `/tasks`
- **API Endpoints**:
  - `GET /api/v1/tasks/status/:status` - Filter by status
  - `GET /api/v1/tasks/:id` - Get single task
- **Features**:
  - Advanced filtering (status, date range, assigned user)
  - Pagination
  - Export to CSV (Manager only)
  - Task calendar view
- **Access**: Supervisor, Manager only

#### 7. Task Detail Page
- **Route**: `/tasks/:id`
- **API Endpoints**:
  - `GET /api/v1/tasks/:id` - Get task details
  - `PATCH /api/v1/tasks/:id/assign` - Assign task
  - `PATCH /api/v1/tasks/:id/start` - Start task
  - `PATCH /api/v1/tasks/:id/complete` - Complete task
  - `PATCH /api/v1/tasks/:id/usage` - Update inventory usage
- **Features**:
  - Full task information
  - Timeline/activity log
  - Assign to user dropdown (Supervisor/Manager)
  - Start/Stop/Complete buttons
  - Inventory usage form (for completed tasks)
  - Notes/comments section
- **Actions**:
  - **Assign Task** (Supervisor/Manager):
    ```json
    PATCH /api/v1/tasks/:id/assign
    { "userId": "user_id_here" }
    ```
  - **Start Task**:
    ```json
    PATCH /api/v1/tasks/:id/start
    {}
    ```
  - **Complete Task**:
    ```json
    PATCH /api/v1/tasks/:id/complete
    { "notes": "Optional completion notes" }
    ```
  - **Update Usage** (Supervisor/Manager):
    ```json
    PATCH /api/v1/tasks/:id/usage
    {
      "inventoryUsage": [
        { "itemId": "inv_id", "quantityUsed": 2.5 }
      ]
    }
    ```

---

### 🍽️ Products Management

#### 8. Products List Page
- **Route**: `/products`
- **API Endpoint**: `GET /api/v1/products`
- **Features**:
  - Grid/List view toggle
  - Search by product name
  - Filter by category, active/inactive
  - Product cards showing:
    - Product name and image
    - Prep time
    - Prep interval
    - Active status
    - Required ingredients count
    - Edit/Delete buttons (Supervisor/Manager)
  - Add Product button (Supervisor/Manager)
- **Query Parameters**:
  - `?search=pizza` - Search products
  - `?isActive=true` - Filter by active status
  - `?category=bakery` - Filter by category

#### 9. Product Detail/Edit Page
- **Route**: `/products/:id`
- **API Endpoints**:
  - `GET /api/v1/products/:id` - Get product details
  - `PUT /api/v1/products/:id` - Update product
  - `DELETE /api/v1/products/:id` - Soft delete
  - `DELETE /api/v1/products/:id/permanent` - Hard delete
- **Features**:
  - View/Edit mode toggle
  - Product information form:
    - Name, category, description
    - Prep time (minutes)
    - Prep interval (hours)
    - Required ingredients list
    - Active/Inactive toggle
  - Delete confirmation modal
  - Audit trail (who created/modified)
- **Access**: View (All), Edit/Delete (Supervisor/Manager only)

#### 10. Add Product Page
- **Route**: `/products/new`
- **API Endpoint**: `POST /api/v1/products`
- **Features**:
  - Product creation form
  - Ingredient selector with autocomplete
  - Image upload (future)
  - Form validation
- **Request Body**:
  ```json
  {
    "name": "Fresh Pizza Dough",
    "category": "Bakery",
    "description": "Pizza dough preparation",
    "prepTimeMinutes": 120,
    "prepIntervalHours": 6,
    "requiredIngredients": [
      { "itemId": "flour_id", "quantity": 5, "unit": "kg" },
      { "itemId": "yeast_id", "quantity": 50, "unit": "g" }
    ],
    "isActive": true
  }
  ```
- **Access**: Supervisor, Manager only

---

### 📦 Inventory Management

#### 11. Inventory List Page
- **Route**: `/inventory`
- **API Endpoints**:
  - `GET /api/v1/inventory` - Get all inventory
  - `GET /api/v1/inventory/low-stock` - Low stock items
- **Features**:
  - Inventory items table
  - Search and filter (by status, category)
  - Stock level indicators (color-coded)
  - Low stock badge/alert
  - Quick restock button
  - Add Item button (Manager only)
  - Export inventory report (Manager)
- **Table Columns**:
  - Item name
  - Category
  - Current quantity
  - Unit
  - Min threshold
  - Status (In Stock, Low Stock, Out of Stock)
  - Last updated
  - Actions

#### 12. Inventory Detail Page
- **Route**: `/inventory/:id`
- **API Endpoints**:
  - `GET /api/v1/inventory/:id` - Get item details
  - `PATCH /api/v1/inventory/:id` - Update item
  - `PATCH /api/v1/inventory/:id/restock` - Restock item
- **Features**:
  - Item information
  - Stock history chart
  - Usage analytics
  - Restock form (Supervisor/Manager)
  - Edit item details (Supervisor/Manager)
- **Actions**:
  - **Update Inventory** (Supervisor/Manager):
    ```json
    PATCH /api/v1/inventory/:id
    {
      "currentQuantity": 25,
      "minThreshold": 10
    }
    ```
  - **Restock** (Supervisor/Manager):
    ```json
    PATCH /api/v1/inventory/:id/restock
    {
      "quantity": 50
    }
    ```

#### 13. Add Inventory Item Page
- **Route**: `/inventory/new`
- **API Endpoint**: `POST /api/v1/inventory`
- **Features**:
  - Item creation form
  - Fields: name, category, unit, initial quantity, min threshold
  - Form validation
- **Request Body**:
  ```json
  {
    "name": "All Purpose Flour",
    "category": "Dry Goods",
    "unit": "kg",
    "currentQuantity": 100,
    "minThreshold": 20
  }
  ```
- **Access**: Manager only

---

### 👤 Profile & Settings

#### 14. Profile Page
- **Route**: `/profile`
- **API Endpoints**:
  - `GET /api/v1/auth/me` - Get current user
  - `PATCH /api/v1/auth/profile` - Update profile
  - `PATCH /api/v1/auth/password` - Change password
- **Features**:
  - View/Edit user information
  - Profile picture upload (future)
  - Personal stats (tasks completed, on-time rate)
  - Change password form
  - Notification preferences
- **Actions**:
  - **Update Profile**:
    ```json
    PATCH /api/v1/auth/profile
    {
      "name": "Updated Name",
      "phone": "+966501234567"
    }
    ```
  - **Change Password**:
    ```json
    PATCH /api/v1/auth/password
    {
      "currentPassword": "old_password",
      "newPassword": "new_password"
    }
    ```

---

### 📊 Reports & Analytics (Manager/Supervisor Only)

#### 15. Reports Dashboard
- **Route**: `/reports`
- **API Endpoints**: (To be implemented)
  - `GET /api/v1/reports/daily` - Daily report
  - `GET /api/v1/reports/tasks-summary` - Task performance
  - `GET /api/v1/reports/inventory-usage` - Inventory analytics
- **Features**:
  - Date range selector
  - Key metrics cards (total tasks, completion rate, late tasks)
  - Charts:
    - Task completion trends
    - Task status breakdown (pie chart)
    - Inventory usage over time
    - Staff performance comparison
  - Export to PDF/Excel
  - Print functionality
- **Access**: Supervisor, Manager only

#### 16. User Management Page (Future)
- **Route**: `/users`
- **API Endpoints**: (To be implemented)
  - `GET /api/v1/users` - List users
  - `POST /api/v1/users` - Create user
  - `PATCH /api/v1/users/:id` - Update user
  - `DELETE /api/v1/users/:id` - Deactivate user
- **Features**:
  - User list table
  - Add/Edit/Deactivate users
  - Role management
  - User activity logs
- **Access**: Manager only

---

### 🔔 Notifications

#### 17. Notifications Center
- **Route**: `/notifications`
- **API Endpoints**: (To be implemented)
  - `GET /api/v1/notifications` - Get user notifications
  - `PATCH /api/v1/notifications/:id/read` - Mark as read
  - `PATCH /api/v1/notifications/read-all` - Mark all as read
- **Features**:
  - Notification list (grouped by date)
  - Filter by type (Reminder, Late, Stock Issue, etc.)
  - Mark as read/unread
  - Real-time updates via Socket.io
  - Notification badge in header
- **Notification Types**:
  - Task reminders
  - Late task alerts
  - Low stock alerts
  - Task assignments
  - Task completions

---

## Global Components

### Navigation & Layout

#### Header/Navbar
- **Features**:
  - Logo and app name
  - Main navigation links (based on role)
  - Search bar (global search)
  - Notifications icon with badge
  - User profile dropdown (Profile, Settings, Logout)
  - Current time display (with timezone)

#### Sidebar (Desktop)
- **Menu Items** (role-based):
  - 📊 Dashboard
  - ✅ My Tasks (All users)
  - 📋 All Tasks (Supervisor/Manager)
  - 🍽️ Products
  - 📦 Inventory
  - 📊 Reports (Supervisor/Manager)
  - 👥 Users (Manager)
  - ⚙️ Settings

#### Mobile Navigation
- Bottom tab bar for mobile
- Hamburger menu for additional items

---

## State Management Strategy

### Global State (Zustand)
- **Auth Store**:
  - User data
  - Token
  - isAuthenticated
  - login/logout functions
- **UI Store**:
  - Sidebar collapsed state
  - Theme (light/dark)
  - Active filters
- **Notification Store**:
  - Unread count
  - Real-time notification updates

### Server State (React Query)
- **Query Keys Structure**:
  ```typescript
  ['tasks', 'today']
  ['tasks', 'my-tasks']
  ['tasks', 'status', status]
  ['tasks', taskId]
  ['products']
  ['products', productId]
  ['inventory']
  ['inventory', 'low-stock']
  ['inventory', itemId]
  ['auth', 'me']
  ```
- **Mutations**:
  - Task actions (start, complete, assign)
  - Product CRUD
  - Inventory updates
  - Profile updates

---

## API Client Setup

### Axios Configuration
```typescript
// src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Real-time Features (Socket.io)

### Events to Listen For
- `notification:new` - New notification received
- `task:assigned` - Task assigned to you
- `task:updated` - Task status changed
- `inventory:low-stock` - Low stock alert

### Socket Setup
```typescript
// src/lib/socket.ts
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token'),
  },
});

export default socket;
```

---

## Route Protection

### Protected Route Component
```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

### Route Configuration
```typescript
// src/router/index.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public routes
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />

// Protected routes
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/tasks/today" element={<TodayTasksPage />} />
  <Route path="/tasks/my-tasks" element={<MyTasksPage />} />
  <Route path="/products" element={<ProductsPage />} />
  <Route path="/inventory" element={<InventoryPage />} />
  <Route path="/profile" element={<ProfilePage />} />
</Route>

// Supervisor/Manager only routes
<Route element={<ProtectedRoute allowedRoles={['supervisor', 'manager']} />}>
  <Route path="/tasks" element={<AllTasksPage />} />
  <Route path="/reports" element={<ReportsPage />} />
</Route>

// Manager only routes
<Route element={<ProtectedRoute allowedRoles={['manager']} />}>
  <Route path="/users" element={<UsersPage />} />
</Route>

// Catch all
<Route path="*" element={<Navigate to="/dashboard" replace />} />
```

---

## API Endpoint Summary

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login | No |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| PATCH | `/api/v1/auth/profile` | Update profile | Yes |
| PATCH | `/api/v1/auth/password` | Change password | Yes |

### Tasks
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/tasks/today` | Get today's tasks | All |
| GET | `/api/v1/tasks/my-tasks` | Get my tasks | All |
| GET | `/api/v1/tasks/status/:status` | Get tasks by status | All |
| GET | `/api/v1/tasks/:id` | Get task details | All |
| PATCH | `/api/v1/tasks/:id/assign` | Assign task | Supervisor, Manager |
| PATCH | `/api/v1/tasks/:id/start` | Start task | All |
| PATCH | `/api/v1/tasks/:id/complete` | Complete task | All |
| PATCH | `/api/v1/tasks/:id/late` | Mark as late | Supervisor, Manager |
| PATCH | `/api/v1/tasks/:id/usage` | Update inventory usage | Supervisor, Manager |

### Products
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/products` | Get all products | All |
| GET | `/api/v1/products/:id` | Get product details | All |
| POST | `/api/v1/products` | Create product | Supervisor, Manager |
| PUT | `/api/v1/products/:id` | Update product | Supervisor, Manager |
| DELETE | `/api/v1/products/:id` | Soft delete product | Manager |
| DELETE | `/api/v1/products/:id/permanent` | Hard delete product | Manager |

### Inventory
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/inventory` | Get all inventory | All |
| GET | `/api/v1/inventory/low-stock` | Get low stock items | All |
| GET | `/api/v1/inventory/:id` | Get item details | All |
| POST | `/api/v1/inventory` | Create inventory item | Manager |
| PATCH | `/api/v1/inventory/:id` | Update item | Supervisor, Manager |
| PATCH | `/api/v1/inventory/:id/restock` | Restock item | Supervisor, Manager |

---

## Deployment Considerations

### Environment Variables
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=Prep Manager
VITE_TIMEZONE=Asia/Riyadh
```

### Build Configuration
- Vite for fast builds
- TypeScript strict mode
- ESLint + Prettier
- Path aliases (@/components, @/lib, etc.)

---

## Development Workflow

### Phase 1: Foundation (Week 1-2)
- [ ] Setup React + TypeScript + Vite
- [ ] Install and configure TailwindCSS + shadcn/ui
- [ ] Setup React Router
- [ ] Create auth store (Zustand)
- [ ] Implement API client (Axios)
- [ ] Build authentication pages (Login, Register)
- [ ] Implement protected routes

### Phase 2: Core Features (Week 3-4)
- [ ] Dashboard page with task overview
- [ ] Today's Tasks page
- [ ] My Tasks page
- [ ] Task detail page with actions
- [ ] Products list and detail pages
- [ ] Basic inventory list

### Phase 3: Advanced Features (Week 5-6)
- [ ] Complete inventory management
- [ ] Task assignment and management (Supervisor/Manager)
- [ ] Reports and analytics
- [ ] Real-time notifications (Socket.io)
- [ ] Profile management

### Phase 4: Polish (Week 7-8)
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Error boundaries and loading states
- [ ] Accessibility improvements
- [ ] Testing (Unit + E2E)
- [ ] Documentation

---

## UI/UX Guidelines

### Color Scheme
- **Primary**: Blue (#3B82F6) - Actions, links
- **Success**: Green (#10B981) - Completed tasks, in stock
- **Warning**: Yellow (#F59E0B) - Low stock, approaching deadline
- **Danger**: Red (#EF4444) - Late tasks, out of stock
- **Info**: Cyan (#06B6D4) - Informational messages

### Status Badges
- **Scheduled**: Blue badge
- **In Progress**: Yellow badge with pulse animation
- **Completed**: Green badge
- **Late**: Red badge
- **Stock Issue**: Orange badge

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Testing Strategy

### Unit Tests (Vitest)
- Component rendering
- User interactions
- State management
- API client functions

### Integration Tests
- User flows (login → dashboard → task actions)
- Form submissions
- API integrations

### E2E Tests (Playwright)
- Critical user journeys
- Role-based access
- Task lifecycle

---

## Future Enhancements

1. **Mobile App** (React Native)
2. **Push Notifications** (FCM)
3. **Barcode Scanning** for inventory
4. **Voice Commands** for hands-free task updates
5. **Advanced Analytics** with AI insights
6. **Multi-language Support** (i18n)
7. **Dark Mode**
8. **Offline Mode** (PWA)
9. **Calendar Integration**
10. **Recipe Management** module

---

## Questions to Clarify

1. **Branding**: Logo, colors, app name preferences?
2. **Timezone**: Default to Asia/Riyadh or user-configurable?
3. **Image Storage**: Local server or cloud (S3, Cloudinary)?
4. **SMS/Email Notifications**: Required immediately or future feature?
5. **Reporting**: Specific KPIs or metrics to track?
6. **Mobile-first** or desktop-first design priority?

---

**Document Version**: 1.0  
**Last Updated**: December 3, 2025  
**Author**: Prep Manager Development Team
