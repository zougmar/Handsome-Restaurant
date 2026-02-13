const { connectToDatabase } = require('../../_lib/mongodb');
const { verifyToken } = require('../../_lib/auth');
const path = require('path');
const Order = require(path.join(process.cwd(), 'backend', 'models', 'Order'));

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT');
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
    // Vercel passes dynamic route params in req.query
    const orderId = req.query.id;

    // GET /api/orders/:id
    if (req.method === 'GET') {
      const order = await Order.findById(orderId)
        .populate('items.menuItem', 'name price image')
        .populate('waiter', 'name');
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      return res.status(200).json(order);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
