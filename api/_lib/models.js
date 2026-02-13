const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Helper to load models with fallback
function loadModel(modelName) {
  const possiblePaths = [
    path.join(process.cwd(), 'backend', 'models', `${modelName}.js`),
    path.join(__dirname, '..', '..', 'backend', 'models', `${modelName}.js`),
    path.resolve(`./backend/models/${modelName}.js`),
  ];

  // Try to find and require the model file
  for (const modelPath of possiblePaths) {
    if (fs.existsSync(modelPath)) {
      try {
        return require(modelPath);
      } catch (e) {
        console.warn(`Failed to load ${modelName} from ${modelPath}:`, e.message);
      }
    }
  }
  
  // Try relative require
  try {
    return require(`../../backend/models/${modelName}`);
  } catch (e) {
    console.warn(`Failed to load ${modelName} from relative path:`, e.message);
  }

  // If model already exists in mongoose, return it
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  // Last resort: create inline schema (should match backend model)
  throw new Error(`Model ${modelName} not found and cannot be created inline`);
}

// Menu Model
function getMenuModel() {
  try {
    const model = loadModel('Menu');
    if (model) {
      console.log('✅ Menu model loaded successfully');
      return model;
    }
  } catch (e) {
    console.warn('⚠️ Could not load Menu model from file, creating inline:', e.message);
  }
  
  // Create inline if not found
  console.log('📝 Creating Menu model inline');
  const menuSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  });
  
  // Return existing model if already registered, otherwise create new
  if (mongoose.models.Menu) {
    console.log('✅ Using existing Menu model from mongoose');
    return mongoose.models.Menu;
  }
  
  const MenuModel = mongoose.model('Menu', menuSchema);
  console.log('✅ Created new Menu model');
  return MenuModel;
}

// Order Model
function getOrderModel() {
  try {
    return loadModel('Order');
  } catch (e) {
    // Create inline if not found
    const orderItemSchema = new mongoose.Schema({
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
      name: String,
      price: Number,
      image: String,
      quantity: { type: Number, required: true, min: 1 },
      specialInstructions: { type: String, default: '' }
    });

    const orderSchema = new mongoose.Schema({
      tableNumber: { type: Number, required: true },
      items: [orderItemSchema],
      status: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
      totalAmount: { type: Number, required: true, min: 0 },
      paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
      waiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      completedAt: { type: Date }
    });

    orderSchema.pre('save', function(next) {
      this.updatedAt = Date.now();
      next();
    });

    return mongoose.models.Order || mongoose.model('Order', orderSchema);
  }
}

// User Model
function getUserModel() {
  try {
    return loadModel('User');
  } catch (e) {
    // Create inline if not found
    const bcrypt = require('bcryptjs');
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true, minlength: 6 },
      role: { type: String, enum: ['admin', 'waiter', 'kitchen', 'cashier'], default: 'waiter' },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    });

    userSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      this.password = await bcrypt.hash(this.password, 10);
      next();
    });

    userSchema.methods.comparePassword = async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };

    return mongoose.models.User || mongoose.model('User', userSchema);
  }
}

// Table Model
function getTableModel() {
  try {
    return loadModel('Table');
  } catch (e) {
    // Create inline if not found
    const tableSchema = new mongoose.Schema({
      number: { type: Number, required: true, unique: true },
      capacity: { type: Number, required: true, min: 1 },
      status: { 
        type: String, 
        enum: ['available', 'occupied', 'reserved'], 
        default: 'available' 
      },
      currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      createdAt: { type: Date, default: Date.now }
    });
    return mongoose.models.Table || mongoose.model('Table', tableSchema);
  }
}

module.exports = {
  getMenuModel,
  getOrderModel,
  getUserModel,
  getTableModel
};
