const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/handsome-restaurant';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    const email = process.argv[2] || 'admin@handsome.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Admin';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists');
      process.exit(1);
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
