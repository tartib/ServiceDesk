# 🎫 ServiceDesk - IT Service Management

A comprehensive web application for managing IT service tickets, tasks, and team workflow with role-based access control.

## 🚀 Features

### Core Functionality
- **Task Management**: Schedule, assign, and track preparation tasks
- **Inventory Tracking**: Monitor ingredient stock levels with low-stock alerts
- **Product Management**: Manage recipes and preparation requirements
- **Role-Based Access**: Different permissions for Prep Staff, Supervisors, and Managers
- **Real-time Updates**: Socket.io integration for live notifications
- **Dashboard Analytics**: Overview of daily tasks, completion rates, and alerts

### User Roles
- **Prep Staff**: View and complete assigned tasks, check inventory
- **Supervisor**: All prep staff features + task assignment, product management, inventory updates
- **Manager**: Full system access including user management, reports, and system configuration

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: Zustand + TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
- **Icons**: Lucide React
- **Date/Time**: date-fns

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ServiceDesk-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v2
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ServiceDesk-app/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   ├── inventory/
│   │   ├── profile/
│   │   ├── reports/
│   │   └── notifications/
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Home page with auth redirect
├── components/
│   ├── auth/                # Authentication components
│   ├── dashboard/           # Dashboard-specific components
│   ├── layout/              # Layout components (Header, Sidebar)
│   ├── tasks/               # Task-related components
│   ├── providers/           # React Query provider
│   └── ui/                  # shadcn/ui components
├── hooks/                   # Custom React Query hooks
│   ├── useAuth.ts
│   ├── useTasks.ts
│   └── useInventory.ts
├── lib/
│   ├── axios.ts             # Axios configuration with interceptors
│   ├── socket.ts            # Socket.io configuration
│   └── utils.ts             # Utility functions
├── store/                   # Zustand state management
│   ├── authStore.ts
│   ├── uiStore.ts
│   └── notificationStore.ts
└── types/
    └── index.ts             # TypeScript type definitions
```

## 🔐 Authentication Flow

1. User lands on `/` (root page)
2. Redirects to `/login` if not authenticated or `/dashboard` if authenticated
3. After successful login/registration, JWT token is stored in localStorage
4. Protected routes check authentication status via `ProtectedRoute` component
5. Role-based access control filters available routes and features

## 📱 Available Routes

### Public Routes
- `/login` - User login
- `/register` - User registration

### Protected Routes (All Authenticated Users)
- `/dashboard` - Main dashboard with overview
- `/tasks/my-tasks` - Personal task queue
- `/tasks/today` - Today's scheduled tasks
- `/inventory` - Inventory overview
- `/profile` - User profile and settings
- `/notifications` - Notification center

### Supervisor/Manager Only
- `/tasks` - All tasks management
- `/reports` - Analytics and reports

### Manager Only
- `/users` - User management (to be implemented)

## 🔧 API Integration

The application connects to a backend API. Key endpoints:

### Authentication
- `POST /api/v2/auth/login` - User login
- `POST /api/v2/auth/register` - User registration
- `GET /api/v2/auth/me` - Get current user

### Tasks
- `GET /api/v2/tasks/today` - Today's tasks
- `GET /api/v2/tasks/my-tasks` - User's assigned tasks
- `PATCH /api/v2/tasks/:id/start` - Start a task
- `PATCH /api/v2/tasks/:id/complete` - Complete a task

### Inventory
- `GET /api/v2/inventory` - List all inventory items
- `GET /api/v2/inventory/low-stock` - Get low stock items
- `PATCH /api/v2/inventory/:id/restock` - Restock item (Supervisor/Manager)

## 🎨 UI Components

Built with **shadcn/ui** for consistent, accessible components:
- Button, Card, Input, Label, Badge
- Select, Textarea, Dialog, Dropdown Menu
- Avatar, and more

All components are customizable via TailwindCSS.

## 🧪 Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Lint Code
```bash
npm run lint
```

## 🚧 Future Enhancements

- [ ] Mobile responsive improvements
- [ ] Advanced reporting with charts (Recharts)
- [ ] User management interface for managers
- [ ] Task detail pages with full CRUD operations
- [ ] Product and inventory CRUD interfaces
- [ ] Real-time notifications via Socket.io
- [ ] PWA support for offline mode
- [ ] Dark mode toggle
- [ ] Multi-language support (i18n)
- [ ] Export reports to PDF/Excel
- [ ] Calendar view for tasks
- [ ] File upload for product images

## 📄 License

This project is private and proprietary.

## 👥 Contributors

ServiceDesk Development Team

---

**Built with ❤️ using Next.js, TypeScript, and TailwindCSS**
