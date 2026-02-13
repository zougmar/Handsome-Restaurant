const { connectToDatabase } = require('../../_lib/mongodb');
const { getOrderModel } = require('../../_lib/models');

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
    const Order = getOrderModel();
    
    // Vercel passes dynamic route params in req.query
    const orderId = req.query.id;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // GET /api/orders/:id
    if (req.method === 'GET') {
      const order = await Order.findById(orderId)
        .populate('items.menuItem', 'name price image')
        .populate('waiter', 'name');
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Convert to plain object for response
      const orderObj = order.toObject ? order.toObject() : order;
      const orderResponse = {
        ...orderObj,
        _id: orderObj._id?.toString() || orderObj._id
      };
      
      return res.status(200).json(orderResponse);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Get order error:', error);
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
