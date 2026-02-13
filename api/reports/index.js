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

    // Determine which report type based on URL path
    const urlPath = req.url || '';
    
    // Daily report
    if (urlPath.includes('/daily') || req.query.type === 'daily') {
      const { date } = req.query;
      const targetDate = date ? new Date(date) : new Date();
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const orders = await Order.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const totalRevenue = orders.reduce((sum, order) => {
        const amount = order.totalAmount || 0;
        return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
      }, 0);
      const totalOrders = orders.length;

      return res.status(200).json({
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
    }

    // Monthly report
    if (urlPath.includes('/monthly') || req.query.type === 'monthly') {
      const { year, month } = req.query;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

      const startOfMonth = new Date(targetYear, targetMonth, 1);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

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

      return res.status(200).json({
        year: targetYear,
        month: targetMonth + 1,
        totalRevenue,
        totalOrders,
        dailyBreakdown
      });
    }

    // Top selling report
    if (urlPath.includes('/top-selling') || req.query.type === 'top-selling') {
      const { limit = 10, startDate, endDate } = req.query;
      
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

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

      return res.status(200).json(topSelling);
    }

    // Default: return error
    return res.status(400).json({ message: 'Invalid report type. Use ?type=daily, ?type=monthly, or ?type=top-selling' });
  } catch (error) {
    console.error('Reports error:', error);
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
