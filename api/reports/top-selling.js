const { connectToDatabase } = require('../_lib/mongodb');
const { getOrderModel } = require('../_lib/models');

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
    const Order = getOrderModel();

    const { limit = 10, startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get all orders (not just paid) for better reporting
    const orders = await Order.find({
      ...dateFilter
    });

    // Count items sold
    const itemCounts = {};
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemId = item.menuItem?.toString() || item.menuItem?._id?.toString() || String(item.menuItem);
          if (!itemCounts[itemId]) {
            itemCounts[itemId] = {
              menuItem: item.menuItem,
              name: item.name || 'Unknown Item',
              quantity: 0,
              revenue: 0
            };
          }
          const qty = item.quantity || 0;
          const price = item.price || 0;
          itemCounts[itemId].quantity += typeof qty === 'number' ? qty : parseInt(qty) || 0;
          itemCounts[itemId].revenue += (typeof price === 'number' ? price : parseFloat(price) || 0) * (typeof qty === 'number' ? qty : parseInt(qty) || 0);
        });
      }
    });

    const topSelling = Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, parseInt(limit));

    res.status(200).json(topSelling);
  } catch (error) {
    console.error('Top selling report error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    const errorMessage = error?.message || String(error) || 'Unknown error';
    res.status(500).json({ 
      message: 'Server error', 
      error: errorMessage
    });
  }
};
