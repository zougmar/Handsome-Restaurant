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

    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Create date range for the day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all orders for the day (not just paid) for better reporting
    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const totalRevenue = orders.reduce((sum, order) => {
      const amount = order.totalAmount || 0;
      return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
    }, 0);
    const totalOrders = orders.length;

    res.status(200).json({
      date: startOfDay.toISOString().split('T')[0],
      totalRevenue,
      totalOrders,
      orders: orders.map(order => {
        const orderObj = order.toObject ? order.toObject() : order;
        return {
          ...orderObj,
          _id: orderObj._id?.toString() || orderObj._id
        };
      })
    });
  } catch (error) {
    console.error('Daily report error:', error);
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
