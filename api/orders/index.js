const { connectToDatabase } = require('../_lib/mongodb');
const path = require('path');
const Order = require(path.join(process.cwd(), 'backend', 'models', 'Order'));
const Menu = require(path.join(process.cwd(), 'backend', 'models', 'Menu'));
const { body, validationResult } = require('express-validator');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();

    // GET /api/orders - Get all orders
    if (req.method === 'GET') {
      const { status, tableNumber } = req.query;
      const query = {};
      
      // Handle multiple status values (comma-separated)
      if (status) {
        const statusArray = status.split(',').map(s => s.trim());
        if (statusArray.length > 1) {
          query.status = { $in: statusArray };
        } else {
          query.status = statusArray[0];
        }
      }
      
      if (tableNumber) {
        query.tableNumber = parseInt(tableNumber);
      }

      const orders = await Order.find(query)
        .populate('items.menuItem', 'name price image')
        .populate('waiter', 'name')
        .sort({ createdAt: -1 });
      
      return res.status(200).json(orders);
    }

    // POST /api/orders - Create new order
    if (req.method === 'POST') {
      // Validation
      await Promise.all([
        body('tableNumber').isInt({ min: 1 }).withMessage('Valid table number is required').run(req),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required').run(req)
      ]);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { tableNumber, items, specialInstructions } = req.body;

      // Validate and populate menu items
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const menuItem = await Menu.findById(item.menuItem);
        if (!menuItem || !menuItem.isAvailable) {
          return res.status(400).json({ 
            message: `Menu item ${item.menuItem} not found or unavailable` 
          });
        }

        const itemTotal = menuItem.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image || '',
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || ''
        });
      }

      // Create order
      const order = new Order({
        tableNumber: parseInt(tableNumber),
        items: orderItems,
        totalAmount,
        status: 'pending',
        paymentStatus: 'unpaid',
        specialInstructions: specialInstructions || ''
      });

      await order.save();
      await order.populate('items.menuItem', 'name price image');

      return res.status(201).json(order);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
