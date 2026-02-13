# Database Seed Script

This script populates your database with sample data for testing and development.

## What it creates

### 📦 Categories (8 categories)
- **Appetizers** (مقبلات)
- **Main Course** (طبق رئيسي)
- **Desserts** (حلويات)
- **Beverages** (مشروبات)
- **Sides** (أطباق جانبية)
- **Sauces** (صلصات)
- **Salads** (سلطات)
- **Bakery** (مخبوزات)

### 📦 Inventory Items (34 items)
- **Vegetables**: Lettuce, Tomatoes, Onions, Cucumbers, Bell Peppers, Potatoes, Carrots
- **Proteins**: Chicken Breast, Ground Beef, Salmon Fillet, Shrimp, Eggs
- **Dairy**: Milk, Heavy Cream, Butter, Mozzarella, Parmesan
- **Pantry**: Flour, Sugar, Salt, Olive Oil, Pasta, Rice, Bread
- **Sauces**: Tomato Sauce, Soy Sauce, Mayonnaise, Ketchup
- **Beverages**: Coffee Beans, Tea Leaves, Orange Juice
- **Dessert**: Chocolate, Vanilla Extract, Cocoa Powder

### 🍽️ Products (17 items)
- **Appetizers**: Caesar Salad, Tomato Soup, Garlic Bread
- **Main Courses**: Grilled Chicken, Spaghetti Bolognese, Grilled Salmon, Beef Steak, Vegetable Stir Fry
- **Desserts**: Chocolate Cake, Vanilla Ice Cream, Tiramisu
- **Beverages**: Fresh Coffee, Iced Tea
- **Sides**: French Fries, Mixed Vegetables
- **Sauces**: House Marinara

### 📋 Tasks (51 tasks)
- 3 tasks per product (past/completed, today/scheduled, future/scheduled)

## Prerequisites

1. **Backend server running** on `http://localhost:5000`
2. **Manager account** with these credentials:
   - Email: `manager@example.com`
   - Password: `password123`

   > If you don't have this account, either create one or update the credentials in `seed.js` (lines 7-10)

## How to run

### Option 1: Using npm script
```bash
npm run seed
```

### Option 2: Direct execution
```bash
node scripts/seed.js
```

## Output

You'll see progress logs like:
```
🌱 Starting database seed...

🔐 Logging in...
✅ Login successful!

📦 Seeding inventory items...
  ✓ Created: Lettuce
  ✓ Created: Tomatoes
  ...
✅ Created 34/34 inventory items

🍽️  Seeding products...
  ✓ Created: Caesar Salad
  ✓ Created: Grilled Chicken
  ...

📋 Seeding tasks...
  ✓ Created task for: Caesar Salad
  ...
✅ Created 51/51 tasks

✅ Database seeding completed successfully! 🎉

📊 Summary:
   - Inventory Items: 34
   - Products: 17
   - Tasks: 51 (3 per product)

🚀 Your app is now ready with sample data!
```

## Troubleshooting

### "Login failed"
- Make sure you have a manager account with the credentials above
- Check that your backend server is running
- Verify the API URL is correct (`http://localhost:5000/api/v1`)

### "Failed to create..."
- Check backend logs for specific errors
- Ensure all required fields are provided
- Verify authentication token is valid

### Database already has data?
If you want to reset and re-seed:
1. Clear your database (use your backend's reset/clear endpoint if available)
2. Run the seed script again

## Customization

To modify the sample data:
1. Open `scripts/seed.js`
2. Edit the `inventoryData` array (lines 13-65)
3. Edit the `createProductsData` function (lines 68-310)
4. Edit the `createTasksData` function if needed (lines 313-341)

## Notes

- Tasks are created with realistic timestamps (past, today, future)
- All products are marked as "active" for scheduling
- Inventory quantities are set to reasonable levels
- Some items will be "low stock" based on thresholds
