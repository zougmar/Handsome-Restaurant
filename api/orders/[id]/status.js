const { connectToDatabase } = require('../../_lib/mongodb');
const path = require('path');
const Order = require(path.join(process.cwd(), 'backend', 'models', 'Order'));
const { body, validationResult } = require('express-validator');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    // Vercel passes dynamic route params in req.query
    const orderId = req.query.id;

    // Validation
    await body('status')
      .isIn(['pending', 'preparing', 'ready', 'served'])
      .withMessage('Invalid status')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    if (status === 'served') {
      order.completedAt = new Date();
    }
    await order.save();

    await order.populate('items.menuItem', 'name price image');
    await order.populate('waiter', 'name');

    return res.status(200).json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
