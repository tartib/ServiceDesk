# 🚀 Quick Start Guide - Prep Manager Backend

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally or connection string
- npm or yarn package manager

---

## 1️⃣ Installation

```bash
# Clone or navigate to project directory
cd prep-manger-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

---

## 2️⃣ Configuration

Edit `.env` file with your settings:

```bash
# Required Configuration
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/prep_manager
JWT_SECRET=your_super_secret_key_here_change_this

# Optional
CORS_ORIGIN=http://localhost:3000
TZ=Asia/Riyadh
```

---

## 3️⃣ Running the Application

### Development Mode
```bash
npm run dev
```
Server starts at: `http://localhost:5000`

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
# Start MongoDB + API
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 4️⃣ Testing the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Register First User (Manager)
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manager",
    "email": "manager@example.com",
    "password": "password123",
    "role": "manager"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response!

### Create a Product
```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Grilled Chicken",
    "category": "main",
    "prepTimeMinutes": 30,
    "prepIntervalHours": 4
  }'
```

### Get Today's Tasks
```bash
curl http://localhost:5000/api/v1/tasks/today \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 5️⃣ Database Seeding (Optional)

Create sample data for testing:

```javascript
// Register users
POST /api/v1/auth/register
{
  "name": "Prep Staff 1",
  "email": "staff1@example.com",
  "password": "password123",
  "role": "prep"
}

// Create inventory items
POST /api/v1/inventory
{
  "name": "Chicken Breast",
  "category": "meat",
  "currentQuantity": 50,
  "unit": "kg",
  "minThreshold": 10,
  "maxThreshold": 100
}

// Create products
POST /api/v1/products
{
  "name": "Grilled Chicken",
  "category": "main",
  "prepTimeMinutes": 30,
  "prepIntervalHours": 4,
  "ingredients": [
    {
      "ingredientId": "INVENTORY_ITEM_ID",
      "name": "Chicken Breast",
      "quantity": 2,
      "unit": "kg"
    }
  ]
}
```

---

## 6️⃣ Background Jobs

Jobs start automatically when server starts:

- ✅ **Task Generator** - Runs every 15 minutes
- ✅ **Late Task Checker** - Runs every 5 minutes  
- ✅ **Inventory Alerts** - Runs every hour

Monitor logs to see jobs running:
```bash
tail -f logs/combined-2025-12-03.log
```

---

## 7️⃣ API Endpoints Summary

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get profile

### Products
- `GET /api/v1/products` - List products
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product

### Tasks
- `GET /api/v1/tasks/today` - Today's tasks
- `GET /api/v1/tasks/my-tasks` - My tasks
- `PATCH /api/v1/tasks/:id/start` - Start task
- `PATCH /api/v1/tasks/:id/complete` - Complete task

### Inventory
- `GET /api/v1/inventory` - List inventory
- `GET /api/v1/inventory/low-stock` - Low stock items
- `PATCH /api/v1/inventory/:id/restock` - Restock item

---

## 8️⃣ Troubleshooting

### MongoDB Connection Error
```bash
# Start MongoDB locally
brew services start mongodb-community
# OR
sudo systemctl start mongod
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5001
```

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 9️⃣ Development Tips

### Watch Mode
```bash
npm run dev
# Auto-restarts on file changes
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Build for Production
```bash
npm run build
# Output: dist/
```

---

## 🔟 Next Steps

1. ✅ Create inventory items
2. ✅ Create products with ingredients
3. ✅ Register staff users
4. ✅ Monitor auto-generated tasks
5. ✅ Test task workflow (start → complete)
6. ✅ Check inventory auto-deduction
7. ✅ Review daily reports

---

## 📚 Documentation

- Full API docs: `IMPLEMENTATION_SUMMARY.md`
- Project structure: `README.md`
- Environment vars: `.env.example`

---

## 🆘 Support

Issues? Check logs:
```bash
# Development
Check console output

# Production
tail -f logs/error-2025-12-03.log
```

---

**Status**: ✅ Ready for Development  
**Version**: 1.0.0  
**Last Updated**: December 3, 2025
