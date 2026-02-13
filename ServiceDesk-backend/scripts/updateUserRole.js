#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/servicedesk';

async function updateUserRole(email, newRole) {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`User with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`Current role: ${user.role}`);

    // Update user role
    const result = await usersCollection.updateOne(
      { _id: user._id },
      { $set: { role: newRole, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 1) {
      console.log(`✅ Successfully updated user role to: ${newRole}`);
    } else {
      console.error('Failed to update user role');
      process.exit(1);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Get email and role from command line arguments
const email = process.argv[2];
const newRole = process.argv[3] || 'supervisor';

if (!email) {
  console.error('Usage: node updateUserRole.js <email> [role]');
  console.error('Example: node updateUserRole.js user@example.com supervisor');
  console.error('Available roles: prep, supervisor, manager');
  process.exit(1);
}

const validRoles = ['prep', 'supervisor', 'manager'];
if (!validRoles.includes(newRole)) {
  console.error(`Invalid role: ${newRole}`);
  console.error(`Available roles: ${validRoles.join(', ')}`);
  process.exit(1);
}

updateUserRole(email, newRole);
