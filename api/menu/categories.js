const { connectToDatabase } = require('../_lib/mongodb');
const { getMenuModel } = require('../_lib/models');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const Menu = getMenuModel();
    const categories = await Menu.distinct('category');
    res.status(200).json(categories.filter(cat => cat)); // Remove null/undefined
  } catch (error) {
    console.error('Categories fetch error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code
    });
    
    // Ensure error message is a string
    const errorMessage = error?.message || String(error) || 'Unknown error';
    
    res.status(500).json({ 
      message: 'Server error', 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        code: error.code,
        stack: error.stack
      } : undefined
    });
  }
};
