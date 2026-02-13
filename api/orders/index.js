const { connectToDatabase } = require('../_lib/mongodb');
const { getOrderModel, getMenuModel } = require('../_lib/models');
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
    const Order = getOrderModel();
    const Menu = getMenuModel();

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
      
      // Convert to plain objects
      const ordersPlain = orders.map(order => {
        const orderObj = order.toObject ? order.toObject() : order;
        return {
          ...orderObj,
          _id: orderObj._id?.toString() || orderObj._id
        };
      });
      
      return res.status(200).json(ordersPlain);
    }

    // POST /api/orders - Create new order
    if (req.method === 'POST') {
      console.log('Creating order with data:', {
        tableNumber: req.body.tableNumber,
        itemsCount: req.body.items?.length
      });

      // Validation
      await Promise.all([
        body('tableNumber').isInt({ min: 1 }).withMessage('Valid table number is required').run(req),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required').run(req)
      ]);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { tableNumber, items, specialInstructions } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ 
          message: 'At least one item is required' 
        });
      }

      // Validate and populate menu items
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        if (!item.menuItem) {
          return res.status(400).json({ 
            message: 'Menu item ID is required for each item' 
          });
        }

        const menuItem = await Menu.findById(item.menuItem);
        if (!menuItem) {
          return res.status(400).json({ 
            message: `Menu item ${item.menuItem} not found` 
          });
        }
        
        if (!menuItem.isAvailable) {
          return res.status(400).json({ 
            message: `Menu item "${menuItem.name}" is not available` 
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
      
      // Convert to plain object for response
      const orderObj = order.toObject ? order.toObject() : order;
      const orderResponse = {
        ...orderObj,
        _id: orderObj._id?.toString() || orderObj._id
      };

      console.log('Order created successfully:', orderResponse._id);
      return res.status(201).json(orderResponse);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Orders error:', error);
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
