const { connectToDatabase } = require('../_lib/mongodb');
const path = require('path');
const Menu = require(path.join(process.cwd(), 'backend', 'models', 'Menu'));

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
    const categories = await Menu.distinct('category');
    res.status(200).json(categories.filter(cat => cat)); // Remove null/undefined
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
