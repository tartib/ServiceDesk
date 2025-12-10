# 🍽️ Prep Manager Backend

Restaurant Food Preparation Management System with automated task scheduling, inventory tracking, and real-time notifications.

## 🚀 Features

- ✅ **Automated Prep Task Scheduling** - Auto-generate tasks based on prep intervals
- 📊 **Real-time Inventory Tracking** - Track ingredients and auto-update on task completion
- 🔔 **Smart Notifications** - Reminders for upcoming tasks and low stock alerts
- 📈 **Daily Reports** - End-of-day performance and waste reports
- 👥 **Role-based Access Control** - Prep staff, supervisors, and managers
- ⏰ **Background Jobs** - Automated cron jobs for task generation and alerts
- 🔍 **Audit Logs** - Complete audit trail of all operations

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **Jobs**: Node-Cron
- **Logging**: Winston
- **Notifications**: Firebase Cloud Messaging

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## 🔧 Configuration

Edit `.env` file with your settings:
- MongoDB connection string
- JWT secret key
- Firebase credentials (for push notifications)
- SMS provider credentials (optional)

## 🏃 Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── models/          # Mongoose schemas
├── controllers/     # Route controllers
├── routes/          # API routes
├── services/        # Business logic
├── middleware/      # Express middleware
├── jobs/            # Cron jobs
├── utils/           # Utility functions
└── types/           # TypeScript types
```

## 🔐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login

### Products
- `GET /api/v1/products` - Get all products
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Prep Tasks
- `GET /api/v1/tasks/today` - Get today's tasks
- `PATCH /api/v1/tasks/:id/start` - Start task
- `PATCH /api/v1/tasks/:id/complete` - Complete task
- `PATCH /api/v1/tasks/:id/assign` - Assign task

### Inventory
- `GET /api/v1/inventory` - Get all inventory
- `PATCH /api/v1/inventory/:id/update` - Update inventory

### Reports
- `GET /api/v1/reports/daily/:date` - Get daily report
- `GET /api/v1/logs` - Get audit logs

## 🔄 Background Jobs

- **Task Generator**: Runs every 15 minutes - Creates new prep tasks
- **Late Task Checker**: Runs every 5 minutes - Marks overdue tasks
- **Inventory Alerts**: Runs every hour - Sends low stock notifications
- **Daily Report**: Runs at 23:59 - Generates end-of-day report

## 👥 User Roles

- **Prep**: Start/complete prep tasks
- **Supervisor**: Manage tasks and approve quantities
- **Manager**: Full access including reports and inventory management

## 📊 Database Collections

- `users` - User accounts and roles
- `products` - Menu items and prep requirements
- `ingredients` - Ingredient definitions
- `inventory` - Current stock levels
- `prep_tasks` - Scheduled prep tasks
- `notifications` - User notifications
- `audit_logs` - System audit trail
- `daily_reports` - End-of-day reports

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 📝 License

ISC
