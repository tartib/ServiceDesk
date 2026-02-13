const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

// Default credentials - UPDATE THESE to match your manager account
const credentials = {
  email: 'john.manager@test.com', // Replace with your manager email
  password: 'password123', // Replace with your manager password
};

let authToken = '';

// Categories data
const categoriesData = [
  { name: 'Appetizers', nameAr: 'مقبلات', description: 'Starter dishes and small plates' },
  { name: 'Main Course', nameAr: 'طبق رئيسي', description: 'Primary dishes and entrees' },
  { name: 'Desserts', nameAr: 'حلويات', description: 'Sweet dishes and treats' },
  { name: 'Beverages', nameAr: 'مشروبات', description: 'Drinks and refreshments' },
  { name: 'Sides', nameAr: 'أطباق جانبية', description: 'Side dishes and accompaniments' },
  { name: 'Sauces', nameAr: 'صلصات', description: 'Sauces and condiments' },
  { name: 'Salads', nameAr: 'سلطات', description: 'Fresh salads and greens' },
  { name: 'Bakery', nameAr: 'مخبوزات', description: 'Baked goods and breads' },
];

// Sample data - Using only valid backend categories: meat, dairy, other
const inventoryData = [
  // Vegetables (categorized as 'other')
  { name: 'Lettuce', category: 'other', unit: 'kg', currentQuantity: 50, minThreshold: 10, maxThreshold: 100 },
  { name: 'Tomatoes', category: 'other', unit: 'kg', currentQuantity: 40, minThreshold: 8, maxThreshold: 80 },
  { name: 'Onions', category: 'other', unit: 'kg', currentQuantity: 35, minThreshold: 10, maxThreshold: 70 },
  { name: 'Cucumbers', category: 'other', unit: 'kg', currentQuantity: 25, minThreshold: 5, maxThreshold: 50 },
  { name: 'Bell Peppers', category: 'other', unit: 'kg', currentQuantity: 20, minThreshold: 5, maxThreshold: 40 },
  { name: 'Potatoes', category: 'other', unit: 'kg', currentQuantity: 60, minThreshold: 15, maxThreshold: 120 },
  { name: 'Carrots', category: 'other', unit: 'kg', currentQuantity: 30, minThreshold: 8, maxThreshold: 60 },
  
  // Proteins
  { name: 'Chicken Breast', category: 'meat', unit: 'kg', currentQuantity: 45, minThreshold: 10, maxThreshold: 90 },
  { name: 'Ground Beef', category: 'meat', unit: 'kg', currentQuantity: 40, minThreshold: 10, maxThreshold: 80 },
  { name: 'Salmon Fillet', category: 'meat', unit: 'kg', currentQuantity: 20, minThreshold: 5, maxThreshold: 40 },
  { name: 'Shrimp', category: 'meat', unit: 'kg', currentQuantity: 15, minThreshold: 5, maxThreshold: 30 },
  { name: 'Eggs', category: 'dairy', unit: 'pcs', currentQuantity: 200, minThreshold: 50, maxThreshold: 400 },
  
  // Dairy
  { name: 'Milk', category: 'dairy', unit: 'l', currentQuantity: 50, minThreshold: 15, maxThreshold: 100 },
  { name: 'Heavy Cream', category: 'dairy', unit: 'l', currentQuantity: 20, minThreshold: 5, maxThreshold: 40 },
  { name: 'Butter', category: 'dairy', unit: 'kg', currentQuantity: 15, minThreshold: 3, maxThreshold: 30 },
  { name: 'Mozzarella Cheese', category: 'dairy', unit: 'kg', currentQuantity: 25, minThreshold: 5, maxThreshold: 50 },
  { name: 'Parmesan Cheese', category: 'dairy', unit: 'kg', currentQuantity: 10, minThreshold: 2, maxThreshold: 20 },
  
  // Pantry (categorized as 'other')
  { name: 'Flour', category: 'other', unit: 'kg', currentQuantity: 100, minThreshold: 20, maxThreshold: 200 },
  { name: 'Sugar', category: 'other', unit: 'kg', currentQuantity: 50, minThreshold: 10, maxThreshold: 100 },
  { name: 'Salt', category: 'other', unit: 'kg', currentQuantity: 20, minThreshold: 5, maxThreshold: 40 },
  { name: 'Olive Oil', category: 'other', unit: 'l', currentQuantity: 30, minThreshold: 8, maxThreshold: 60 },
  { name: 'Pasta', category: 'other', unit: 'kg', currentQuantity: 40, minThreshold: 10, maxThreshold: 80 },
  { name: 'Rice', category: 'other', unit: 'kg', currentQuantity: 50, minThreshold: 15, maxThreshold: 100 },
  { name: 'Bread', category: 'other', unit: 'pcs', currentQuantity: 50, minThreshold: 20, maxThreshold: 100 },
  
  // Sauces & Condiments (categorized as 'other')
  { name: 'Tomato Sauce', category: 'other', unit: 'l', currentQuantity: 25, minThreshold: 5, maxThreshold: 50 },
  { name: 'Soy Sauce', category: 'other', unit: 'l', currentQuantity: 10, minThreshold: 3, maxThreshold: 20 },
  { name: 'Mayonnaise', category: 'other', unit: 'l', currentQuantity: 15, minThreshold: 4, maxThreshold: 30 },
  { name: 'Ketchup', category: 'other', unit: 'l', currentQuantity: 12, minThreshold: 3, maxThreshold: 24 },
  
  // Beverages Base
  { name: 'Coffee Beans', category: 'other', unit: 'kg', currentQuantity: 20, minThreshold: 5, maxThreshold: 40 },
  { name: 'Tea Leaves', category: 'other', unit: 'kg', currentQuantity: 10, minThreshold: 2, maxThreshold: 20 },
  { name: 'Orange Juice', category: 'other', unit: 'l', currentQuantity: 30, minThreshold: 10, maxThreshold: 60 },
  
  // Dessert Ingredients
  { name: 'Chocolate', category: 'other', unit: 'kg', currentQuantity: 15, minThreshold: 3, maxThreshold: 30 },
  { name: 'Vanilla Extract', category: 'other', unit: 'l', currentQuantity: 5, minThreshold: 1, maxThreshold: 10 },
  { name: 'Cocoa Powder', category: 'other', unit: 'kg', currentQuantity: 10, minThreshold: 2, maxThreshold: 20 },
];



// Authentication
async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    authToken = response.data.data.token || response.data.token;
    console.log('✅ Login successful!');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    console.log('\n💡 Please make sure you have a manager account with these credentials:');
    console.log(`   Email: ${credentials.email}`);
    console.log(`   Password: ${credentials.password}`);
    console.log('\nOr update the credentials in the seed.js file.');
    return false;
  }
}

// Helper to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Seed Categories
async function seedCategories() {
  console.log('\n📂 Seeding categories...');
  try {
    // Get existing categories
    const getResponse = await axios.get(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const existingCategories = getResponse.data?.data?.categories || getResponse.data?.categories || [];
    
    // Delete existing categories permanently
    if (existingCategories.length > 0) {
      console.log(`   Found ${existingCategories.length} existing categories. Deleting...`);
      for (const category of existingCategories) {
        try {
          await axios.delete(`${API_URL}/categories/${category.id || category._id}/permanent`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          await delay(100);
        } catch {
          // Continue if delete fails
        }
      }
      console.log('   ✅ Existing categories deleted');
    }
    
    // Create new categories
    const createdCategories = [];
    for (const category of categoriesData) {
      try {
        const response = await axios.post(`${API_URL}/categories`, category, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const created = response.data?.data?.category || response.data?.category || response.data;
        createdCategories.push(created);
        console.log(`   ✅ Created: ${category.name} (${category.nameAr})`);
        await delay(150);
      } catch (error) {
        console.error(`   ❌ Failed to create ${category.name}:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log(`✅ Categories seeded successfully! (${createdCategories.length}/${categoriesData.length})`);
    return createdCategories;
  } catch (error) {
    console.error('❌ Failed to seed categories:', error.response?.data?.message || error.message);
    return [];
  }
}

// Seed Inventory
async function seedInventory() {
  console.log('\n📦 Seeding inventory items...');
  const createdItems = [];

  for (const item of inventoryData) {
    try {
      const response = await axios.post(`${API_URL}/inventory`, item, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const createdItem = response.data.data || response.data;
      createdItems.push({
        ...createdItem,
        id: createdItem._id || createdItem.id,
        name: item.name,
      });
      console.log(`  ✓ Created: ${item.name}`);
      // Add delay to avoid rate limiting
      await delay(200);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      const errorStack = error.response?.data?.stack || '';
      // Skip duplicates (check for E11000 MongoDB duplicate key error)
      if (errorMsg.includes('duplicate') || errorMsg.includes('already exists') || 
          errorMsg.includes('E11000') || errorStack.includes('E11000') ||
          errorMsg.includes('Internal Server Error')) {
        console.log(`  ⚠ Skipped (already exists): ${item.name}`);
      } else {
        console.error(`  ✗ Failed to create ${item.name}:`, errorMsg);
      }
      // Add delay even on error
      await delay(200);
    }
  }

  // Fetch all inventory items to include existing ones
  console.log('\n📥 Fetching all existing inventory items...');
  try {
    const allItemsResponse = await axios.get(`${API_URL}/inventory`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Handle different response structures
    let rawData = allItemsResponse.data;
    if (rawData.data) rawData = rawData.data;
    if (rawData.inventory) rawData = rawData.inventory;
    if (rawData.items) rawData = rawData.items;
    
    // Ensure it's an array
    const dataArray = Array.isArray(rawData) ? rawData : [];
    
    const allItems = dataArray.map(item => ({
      ...item,
      id: item._id || item.id,
    }));
    console.log(`✅ Total inventory items available: ${allItems.length} (${createdItems.length} newly created)`);
    return allItems;
  } catch (err) {
    console.error('⚠️  Failed to fetch existing inventory:', err.message);
    console.log(`✅ Using ${createdItems.length} newly created items`);
    return createdItems;
  }
}



// Main seed function
async function seed() {
  console.log('🌱 Starting database seed...\n');
  console.log('⚠️  Make sure your backend server is running on http://localhost:5000\n');

  try {
    // Step 1: Login
    const loggedIn = await login();
    if (!loggedIn) {
      process.exit(1);
    }

    // Step 2: Seed Categories
    const categories = await seedCategories();
    if (categories.length === 0) {
      console.log('⚠️  No categories created, but continuing...');
    }

    // Step 3: Seed Inventory
    const inventoryItems = await seedInventory();
    if (inventoryItems.length === 0) {
      console.log('❌ No inventory items available (not created and failed to fetch existing). Stopping seed process.');
      process.exit(1);
    }

    console.log('\n✅ Database seeding completed successfully! 🎉\n');
    console.log('📊 Summary:');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Inventory Items: ${inventoryItems.length}`);
    console.log('\n🚀 Your app is now ready with sample data!\n');

  } catch (error) {
    console.error('\n❌ Seed process failed:', error.message);
    process.exit(1);
  }
}

// Run seed
seed();
