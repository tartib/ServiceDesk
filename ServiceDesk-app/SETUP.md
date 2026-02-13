# Setup Guide - ServiceDesk

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

**Important**: Replace `localhost:5000` with your actual backend API URL if different.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Backend API Requirements

This frontend application requires a backend API with the following endpoints:

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user info
- `PATCH /api/v1/auth/profile` - Update user profile
- `PATCH /api/v1/auth/password` - Change password

### Task Endpoints
- `GET /api/v1/tasks/today` - Get today's tasks
- `GET /api/v1/tasks/my-tasks` - Get user's assigned tasks
- `GET /api/v1/tasks/status/:status` - Get tasks by status
- `GET /api/v1/tasks/:id` - Get task details
- `PATCH /api/v1/tasks/:id/assign` - Assign task to user
- `PATCH /api/v1/tasks/:id/start` - Start a task
- `PATCH /api/v1/tasks/:id/complete` - Complete a task
- `PATCH /api/v1/tasks/:id/usage` - Update inventory usage

### Inventory Endpoints
- `GET /api/v1/inventory` - Get all inventory items
- `GET /api/v1/inventory/low-stock` - Get low stock items
- `GET /api/v1/inventory/:id` - Get inventory item details
- `POST /api/v1/inventory` - Create inventory item
- `PATCH /api/v1/inventory/:id` - Update inventory item
- `PATCH /api/v1/inventory/:id/restock` - Restock item

## Authentication Flow

1. User registers or logs in via `/login` or `/register`
2. Backend returns user object and JWT token
3. Token is stored in localStorage
4. All subsequent API requests include the token in Authorization header: `Bearer <token>`
5. If token is invalid (401 response), user is redirected to login

## Role-Based Access

The application supports three user roles:

- **prep**: Basic prep staff - Can view and complete tasks
- **supervisor**: Team lead - Can assign tasks, manage products/inventory
- **manager**: Full admin access - All features including user management

Routes are protected based on these roles using the `ProtectedRoute` component.

## State Management

### Zustand Stores (Client State)
- **authStore**: User authentication and profile data
- **uiStore**: UI preferences (sidebar state, theme)
- **notificationStore**: Real-time notifications

### TanStack Query (Server State)
- Handles all API data fetching with caching
- Automatic refetching and invalidation
- Query keys follow pattern: `['resource', ...params]`

## Socket.io Integration (Future)

The app includes Socket.io client setup for real-time features:
- Task assignments
- Low stock alerts
- Notification updates

To enable, ensure your backend has Socket.io server running at `NEXT_PUBLIC_SOCKET_URL`.

## Development Tips

### Adding New API Endpoints

1. Define types in `types/index.ts`
2. Create React Query hooks in `hooks/` directory
3. Use hooks in components with `useQuery` or `useMutation`

Example:
```typescript
// In hooks/useNewFeature.ts
export const useNewFeature = () => {
  return useQuery({
    queryKey: ['feature'],
    queryFn: async () => {
      const response = await api.get('/feature');
      return response.data;
    },
  });
};
```

### Adding New Pages

1. Create page in `app/(dashboard)/your-page/page.tsx`
2. Wrap with `DashboardLayout` for protected routes
3. Add route to sidebar in `components/layout/Sidebar.tsx`

### Adding New Components

1. Place in appropriate directory under `components/`
2. Use existing shadcn/ui components as building blocks
3. Import utilities from `lib/utils.ts` for styling

## Troubleshooting

### "Network Error" on Login
- Check if backend API is running
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

### "Cannot find module" Errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript paths in `tsconfig.json`

### Styling Not Working
- Verify TailwindCSS is configured correctly
- Check `app/globals.css` is imported in `layout.tsx`
- Run `npm run dev` to restart the dev server

## Production Build

```bash
npm run build
npm start
```

The optimized build will be created in `.next/` directory.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Zustand State Management](https://zustand-demo.pmnd.rs)
