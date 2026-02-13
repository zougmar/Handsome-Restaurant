const mongoose = require('mongoose');

let cached = null;

async function connectToDatabase() {
  if (cached) {
    return cached;
  }

  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    cached = conn;
    console.log('✅ MongoDB Connected');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
  }
}

module.exports = { connectToDatabase };
