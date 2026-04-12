/**
 * Reset passwords for existing test users.
 * Run: node scripts/resetTestPasswords.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/servicedesk';

const users = [
  { email: 'admin@servicedesk.com', password: 'Admin@123' },
  { email: 'supervisor@servicedesk.com', password: 'Super@123' },
  { email: 'prep@servicedesk.com', password: 'Prep@123' },
  { email: 'test@servicedesk.com', password: 'Test@123' },
];

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  for (const { email, password } of users) {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.collection('users').updateOne(
      { email },
      { $set: { password: hash, isActive: true }, $unset: { refreshTokenHash: '' } }
    );
    if (result.matchedCount === 0) {
      console.log(`⚠️  User ${email} not found`);
    } else {
      console.log(`✅ Reset password for ${email}`);
    }
  }

  console.log('\nDone. You can now login with:');
  console.log('  Email: admin@servicedesk.com');
  console.log('  Password: Admin@123');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
