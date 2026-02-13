const express = require('express');
const Order = require('../models/Order');
const Menu = require('../models/Menu');
const { verifyToken, checkRole } = require('../middleware/auth');
const router = express.Router();

// All routes require admin authentication
router.use(verifyToken, checkRole('admin'));

// @route   GET /api/reports/daily
// @desc    Get daily sales report
// @access  Private (Admin)
router.get('/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      paymentStatus: 'paid'
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      totalRevenue,
      totalOrders,
      orders
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/monthly
// @desc    Get monthly revenue report
// @access  Private (Admin)
router.get('/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      paymentStatus: 'paid'
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;

    // Daily breakdown
    const dailyBreakdown = {};
    orders.forEach(order => {
      const day = order.createdAt.getDate();
      if (!dailyBreakdown[day]) {
        dailyBreakdown[day] = { revenue: 0, orders: 0 };
      }
      dailyBreakdown[day].revenue += order.totalAmount;
      dailyBreakdown[day].orders += 1;
    });

    res.json({
      year: targetYear,
      month: targetMonth + 1,
      totalRevenue,
      totalOrders,
      dailyBreakdown
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/top-selling
// @desc    Get top selling dishes
// @access  Private (Admin)
router.get('/top-selling', async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find({
      ...dateFilter,
      paymentStatus: 'paid'
    });

    // Count items sold
    const itemCounts = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.menuItem.toString();
        if (!itemCounts[itemId]) {
          itemCounts[itemId] = {
            menuItem: item.menuItem,
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        itemCounts[itemId].quantity += item.quantity;
        itemCounts[itemId].revenue += item.price * item.quantity;
      });
    });

    const topSelling = Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, parseInt(limit));

    res.json(topSelling);
  } catch (error) {
    console.error('Top selling report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/history
// @desc    Get order history
// @access  Private (Admin)
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, startDate, endDate, status } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.menuItem', 'name price image')
      .populate('waiter', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(orders);
  } catch (error) {
    console.error('Order history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
