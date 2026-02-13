const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Menu = require('../models/Menu');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private (or public for kitchen display)
router.get('/', async (req, res) => {
  // Allow kitchen interface to access without token for display purposes
  // In production, you might want to add a special kitchen token or make it require auth
  try {
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
    
    if (tableNumber) query.tableNumber = parseInt(tableNumber);

    const orders = await Order.find(query)
      .populate('items.menuItem', 'name price image')
      .populate('waiter', 'name')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem', 'name price image')
      .populate('waiter', 'name');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Public (customers can place orders without auth)
router.post('/', [
  body('tableNumber').isInt({ min: 1 }).withMessage('Valid table number is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required')
], async (req, res) => {
  try {
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
        return res.status(400).json({ message: `Menu item ${item.menuItem} not found or unavailable` });
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        image: menuItem.image || '', // Include image in order item
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || ''
      });
    }

    // Create order
    // If user is authenticated and is a waiter, assign them to the order
    let waiterId = undefined;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const User = require('../models/User');
        const user = await User.findById(decoded.userId);
        if (user && user.role === 'waiter') {
          waiterId = user._id;
        }
      }
    } catch (authError) {
      // Not authenticated or invalid token - that's fine for customer orders
    }

    const order = new Order({
      tableNumber,
      items: orderItems,
      totalAmount,
      waiter: waiterId,
      status: 'pending', // Explicitly set status
      paymentStatus: 'unpaid' // Explicitly set payment status
    });

    await order.save();
    console.log('✅ Order created:', order._id, 'Status:', order.status, 'Table:', order.tableNumber);

    // Update table status
    const table = await Table.findOne({ number: tableNumber });
    if (table) {
      table.status = 'occupied';
      table.currentOrder = order._id;
      await table.save();
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      // Populate order before emitting
      try {
        const populatedOrder = await Order.findById(order._id)
          .populate('items.menuItem', 'name price image')
          .populate('waiter', 'name');
        
        console.log('📢 Emitting new order:', populatedOrder._id, 'for table:', tableNumber);
        io.emit('order-updated', { 
          type: 'new', 
          order: populatedOrder 
        });
        io.emit('table-updated', { tableNumber, status: 'occupied' });
      } catch (populateError) {
        console.error('Error populating order for emission:', populateError);
        // Emit with basic order if populate fails
        io.emit('order-updated', { 
          type: 'new', 
          order: order 
        });
        io.emit('table-updated', { tableNumber, status: 'occupied' });
      }
    } else {
      console.warn('⚠️ Socket.io not available - order created but not broadcasted');
    }

    try {
      const populatedOrder = await Order.findById(order._id)
        .populate('items.menuItem', 'name price image')
        .populate('waiter', 'name');

      res.status(201).json(populatedOrder);
    } catch (populateError) {
      // If populate fails, return order without population
      console.error('Populate error:', populateError);
      res.status(201).json(order);
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Public (for kitchen/waiter interfaces)
router.put('/:id/status', [
  body('status').isIn(['pending', 'preparing', 'ready', 'served']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const updateData = { status };

    if (status === 'served') {
      updateData.completedAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('items.menuItem', 'name price image')
     .populate('waiter', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('order-updated', { type: 'status-change', order });
    }

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Update payment status
// @access  Public (for waiter interface)
router.put('/:id/payment', [
  body('paymentStatus').isIn(['paid', 'unpaid']).withMessage('Invalid payment status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentStatus } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true, runValidators: true }
    ).populate('items.menuItem', 'name price image')
     .populate('waiter', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update table status
    if (paymentStatus === 'paid') {
      const table = await Table.findOne({ number: order.tableNumber });
      if (table) {
        table.status = 'free';
        table.currentOrder = null;
        await table.save();

        const io = req.app.get('io');
        if (io) {
          io.emit('table-updated', { tableNumber: order.tableNumber, status: 'free' });
        }
      }
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('order-updated', { type: 'payment', order });
    }

    res.json(order);
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order (add items)
// @access  Private
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { items } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Add new items
    if (items && items.length > 0) {
      for (const item of items) {
        const menuItem = await Menu.findById(item.menuItem);
        if (!menuItem || !menuItem.isAvailable) {
          continue;
        }

        const itemTotal = menuItem.price * item.quantity;
        order.totalAmount += itemTotal;

        order.items.push({
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || ''
        });
      }

      await order.save();
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name price image')
      .populate('waiter', 'name');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('order-updated', { type: 'updated', order: populatedOrder });
    }

    res.json(populatedOrder);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
