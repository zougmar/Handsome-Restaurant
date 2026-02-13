const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Menu = require('../models/Menu');
const Table = require('../models/Table');

const seedData = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/handsome-restaurant';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Menu.deleteMany({});
    await Table.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@handsome.com',
      password: adminPassword,
      role: 'admin',
      isActive: true
    });
    console.log('👤 Created admin user:', admin.email);

    // Create Sample Users
    const waiterPassword = await bcrypt.hash('waiter123', 10);
    await User.create([
      {
        name: 'John Waiter',
        email: 'waiter@handsome.com',
        password: waiterPassword,
        role: 'waiter',
        isActive: true
      },
      {
        name: 'Chef Mario',
        email: 'kitchen@handsome.com',
        password: waiterPassword,
        role: 'kitchen',
        isActive: true
      }
    ]);
    console.log('👥 Created sample users');

    // Create Menu Items
    const menuItems = [
      // Appetizers
      { name: 'Caesar Salad', description: 'Fresh romaine lettuce with caesar dressing', price: 12.99, category: 'Appetizers', isAvailable: true },
      { name: 'Bruschetta', description: 'Toasted bread with tomatoes and basil', price: 9.99, category: 'Appetizers', isAvailable: true },
      { name: 'Mozzarella Sticks', description: 'Crispy mozzarella with marinara sauce', price: 10.99, category: 'Appetizers', isAvailable: true },
      
      // Main Course
      { name: 'Grilled Salmon', description: 'Fresh salmon with lemon butter sauce', price: 24.99, category: 'Main Course', isAvailable: true },
      { name: 'Ribeye Steak', description: '12oz ribeye with mashed potatoes', price: 32.99, category: 'Main Course', isAvailable: true },
      { name: 'Chicken Parmesan', description: 'Breaded chicken with marinara and mozzarella', price: 18.99, category: 'Main Course', isAvailable: true },
      { name: 'Pasta Carbonara', description: 'Creamy pasta with bacon and parmesan', price: 16.99, category: 'Main Course', isAvailable: true },
      { name: 'Margherita Pizza', description: 'Classic pizza with tomato and mozzarella', price: 14.99, category: 'Main Course', isAvailable: true },
      
      // Desserts
      { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with vanilla ice cream', price: 8.99, category: 'Desserts', isAvailable: true },
      { name: 'Tiramisu', description: 'Classic Italian dessert', price: 7.99, category: 'Desserts', isAvailable: true },
      { name: 'Cheesecake', description: 'New York style cheesecake', price: 8.99, category: 'Desserts', isAvailable: true },
      
      // Beverages
      { name: 'Coca Cola', description: 'Classic soft drink', price: 2.99, category: 'Beverages', isAvailable: true },
      { name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice', price: 4.99, category: 'Beverages', isAvailable: true },
      { name: 'Coffee', description: 'Freshly brewed coffee', price: 3.99, category: 'Beverages', isAvailable: true },
      { name: 'Iced Tea', description: 'Refreshing iced tea', price: 2.99, category: 'Beverages', isAvailable: true },
    ];

    await Menu.insertMany(menuItems);
    console.log(`🍽️  Created ${menuItems.length} menu items`);

    // Create Tables
    const tables = [];
    for (let i = 1; i <= 12; i++) {
      tables.push({
        number: i,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        status: 'free'
      });
    }
    await Table.insertMany(tables);
    console.log(`🪑 Created ${tables.length} tables`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Admin: admin@handsome.com / admin123');
    console.log('   Waiter: waiter@handsome.com / waiter123');
    console.log('   Kitchen: kitchen@handsome.com / waiter123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
