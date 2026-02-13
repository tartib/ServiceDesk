import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';
import { UserRole } from '../types';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prep_manager';

const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@servicedesk.com',
    password: 'Admin@123',
    role: UserRole.MANAGER,
    phone: '+966-50-0000001',
    isActive: true,
  },
  {
    name: 'Supervisor User',
    email: 'supervisor@servicedesk.com',
    password: 'Super@123',
    role: UserRole.SUPERVISOR,
    phone: '+966-50-0000002',
    isActive: true,
  },
  {
    name: 'Prep User',
    email: 'prep@servicedesk.com',
    password: 'Prep@123',
    role: UserRole.PREP,
    phone: '+966-50-0000003',
    isActive: true,
  },
  {
    name: 'Test User',
    email: 'test@servicedesk.com',
    password: 'Test@123',
    role: UserRole.PREP,
    phone: '+966-50-0000004',
    isActive: true,
  },
  // 10 additional member users
  {
    name: 'Ahmed Al-Farsi',
    email: 'ahmed.alfarsi@servicedesk.com',
    password: 'Member@123',
    role: UserRole.PREP,
    phone: '+966-50-0000005',
    isActive: true,
  },
  {
    name: 'Sara Al-Rashid',
    email: 'sara.alrashid@servicedesk.com',
    password: 'Member@123',
    role: UserRole.PREP,
    phone: '+966-50-0000006',
    isActive: true,
  },
  {
    name: 'Mohammed Al-Qahtani',
    email: 'mohammed.alqahtani@servicedesk.com',
    password: 'Member@123',
    role: UserRole.PREP,
    phone: '+966-50-0000007',
    isActive: true,
  },
  {
    name: 'Fatima Al-Dosari',
    email: 'fatima.aldosari@servicedesk.com',
    password: 'Member@123',
    role: UserRole.PREP,
    phone: '+966-50-0000008',
    isActive: true,
  },
  {
    name: 'Khalid Al-Otaibi',
    email: 'khalid.alotaibi@servicedesk.com',
    password: 'Member@123',
    role: UserRole.PREP,
    phone: '+966-50-0000009',
    isActive: true,
  },
  {
    name: 'Noura Al-Shammari',
    email: 'noura.alshammari@servicedesk.com',
    password: 'Member@123',
    role: UserRole.PREP,
    phone: '+966-50-0000010',
    isActive: true,
  },
  {
    name: 'Omar Al-Harbi',
    email: 'omar.alharbi@servicedesk.com',
    password: 'Member@123',
    role: UserRole.PREP,
    phone: '+966-50-0000011',
    isActive: true,
  },
  {
    name: 'Layla Al-Ghamdi',
    email: 'layla.alghamdi@servicedesk.com',
    password: 'Member@123',
    role: UserRole.PREP,
    phone: '+966-50-0000012',
    isActive: true,
  },
  {
    name: 'Yusuf Al-Zahrani',
    email: 'yusuf.alzahrani@servicedesk.com',
    password: 'Member@123',
    role: UserRole.PREP,
    phone: '+966-50-0000013',
    isActive: true,
  },
  {
    name: 'Hana Al-Mutairi',
    email: 'hana.almutairi@servicedesk.com',
    password: 'Member@123',
    role: UserRole.PREP,
    phone: '+966-50-0000014',
    isActive: true,
  },
];

async function seedTestUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      await User.create(userData);
      console.log(`✅ Created user: ${userData.email}`);
    }

    console.log('\n========================================');
    console.log('🔧 Development Test Accounts');
    console.log('========================================\n');
    
    console.log('| Role       | Email                                | Password    |');
    console.log('|------------|--------------------------------------|-------------|');
    console.log('| Manager    | admin@servicedesk.com                | Admin@123   |');
    console.log('| Supervisor | supervisor@servicedesk.com           | Super@123   |');
    console.log('| Prep       | prep@servicedesk.com                 | Prep@123    |');
    console.log('| Prep       | test@servicedesk.com                 | Test@123    |');
    console.log('|------------|--------------------------------------|-------------|');
    console.log('| Member     | ahmed.alfarsi@servicedesk.com        | Member@123  |');
    console.log('| Member     | sara.alrashid@servicedesk.com        | Member@123  |');
    console.log('| Member     | mohammed.alqahtani@servicedesk.com   | Member@123  |');
    console.log('| Member     | fatima.aldosari@servicedesk.com      | Member@123  |');
    console.log('| Member     | khalid.alotaibi@servicedesk.com      | Member@123  |');
    console.log('| Member     | noura.alshammari@servicedesk.com     | Member@123  |');
    console.log('| Member     | omar.alharbi@servicedesk.com         | Member@123  |');
    console.log('| Member     | layla.alghamdi@servicedesk.com       | Member@123  |');
    console.log('| Member     | yusuf.alzahrani@servicedesk.com      | Member@123  |');
    console.log('| Member     | hana.almutairi@servicedesk.com       | Member@123  |');
    console.log('\n========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding test users:', error);
    process.exit(1);
  }
}

seedTestUsers();
