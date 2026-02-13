const { connectToDatabase } = require('../_lib/mongodb');
const path = require('path');
const Menu = require(path.join(process.cwd(), 'backend', 'models', 'Menu'));

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
    const menu = await Menu.find({ isAvailable: true }).sort({ category: 1, name: 1 });
    
    // Convert images to full URLs if needed
    const menuWithImages = menu.map(item => ({
      ...item.toObject(),
      image: item.image && !item.image.startsWith('http') 
        ? item.image.startsWith('/') 
          ? `${req.headers.origin || ''}${item.image}`
          : item.image
        : item.image
    }));

    res.status(200).json(menuWithImages);
  } catch (error) {
    console.error('Menu fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
