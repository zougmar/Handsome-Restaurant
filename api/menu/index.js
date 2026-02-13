const { connectToDatabase } = require('../_lib/mongodb');
const { getMenuModel } = require('../_lib/models');

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
    const Menu = getMenuModel();
    
    // Check if requesting categories (check both URL path and query param)
    const urlPath = req.url || '';
    if (urlPath.includes('/categories') || req.query.type === 'categories') {
      const categories = await Menu.distinct('category');
      return res.status(200).json(categories.filter(cat => cat)); // Remove null/undefined
    }
    
    // Otherwise return menu items
    const menu = await Menu.find({ isAvailable: true }).sort({ category: 1, name: 1 });
    
    // Convert to plain objects
    const menuWithImages = menu.map(item => {
      const itemObj = item.toObject ? item.toObject() : item;
      return {
        ...itemObj,
        _id: itemObj._id?.toString() || itemObj._id,
        image: itemObj.image && !itemObj.image.startsWith('http') 
          ? itemObj.image.startsWith('/') 
            ? `${req.headers.origin || ''}${itemObj.image}`
            : itemObj.image
          : itemObj.image
      };
    });

    res.status(200).json(menuWithImages);
  } catch (error) {
    console.error('Menu fetch error:', error);
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
