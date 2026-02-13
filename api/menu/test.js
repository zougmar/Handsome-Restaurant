// Simple test endpoint to check if the function is working
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Test basic functionality
    const mongoose = require('mongoose');
    const { connectToDatabase } = require('../_lib/mongodb');
    
    res.status(200).json({
      success: true,
      message: 'Test endpoint working',
      mongooseVersion: mongoose.version,
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriLength: process.env.MONGODB_URI?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error?.message || String(error),
      details: {
        name: error?.name,
        code: error?.code
      }
    });
  }
};
