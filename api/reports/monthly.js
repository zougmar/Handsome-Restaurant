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

    const { year, month } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Get all orders for the month (not just paid) for better reporting
    const orders = await Order.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalRevenue = orders.reduce((sum, order) => {
      const amount = order.totalAmount || 0;
      return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
    }, 0);
    const totalOrders = orders.length;

    // Daily breakdown
    const dailyBreakdown = {};
    orders.forEach(order => {
      const day = new Date(order.createdAt).getDate();
      if (!dailyBreakdown[day]) {
        dailyBreakdown[day] = { revenue: 0, orders: 0 };
      }
      const amount = order.totalAmount || 0;
      dailyBreakdown[day].revenue += typeof amount === 'number' ? amount : parseFloat(amount) || 0;
      dailyBreakdown[day].orders += 1;
    });

    res.status(200).json({
      year: targetYear,
      month: targetMonth + 1,
      totalRevenue,
      totalOrders,
      dailyBreakdown
    });
  } catch (error) {
    console.error('Monthly report error:', error);
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
