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
    const errorMessage = error?.message || String(error) || 'MongoDB connection failed';
    console.error('❌ MongoDB Connection Error:', errorMessage);
    console.error('Connection details:', {
      hasUri: !!mongoUri,
      uriLength: mongoUri?.length || 0,
      errorName: error?.name,
      errorCode: error?.code
    });
    
    // Create a new error with a proper message
    const connectionError = new Error(errorMessage);
    connectionError.name = error?.name || 'MongoDBConnectionError';
    connectionError.code = error?.code;
    throw connectionError;
  }
}

module.exports = { connectToDatabase };
