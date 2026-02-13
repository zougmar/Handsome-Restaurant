const { connectToDatabase } = require('../_lib/mongodb');
const { getOrderModel, getTableModel } = require('../_lib/models');

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
    const Table = getTableModel();
    const Order = getOrderModel();

    // GET /api/tables - Get all tables
    if (req.method === 'GET') {
      const tables = await Table.find().sort({ number: 1 });
      
      // Update table status based on active orders
      const tablesWithStatus = await Promise.all(
        tables.map(async (table) => {
          const activeOrder = await Order.findOne({
            tableNumber: table.number,
            paymentStatus: 'unpaid',
            status: { $in: ['pending', 'preparing', 'ready', 'served'] }
          });

          const tableObj = table.toObject ? table.toObject() : table;
          return {
            ...tableObj,
            _id: tableObj._id?.toString() || tableObj._id,
            status: activeOrder ? 'occupied' : table.status,
            currentOrder: activeOrder?._id?.toString() || table.currentOrder?.toString() || null
          };
        })
      );

      return res.status(200).json(tablesWithStatus);
    }

    // POST /api/tables - Create new table
    if (req.method === 'POST') {
      const { number, capacity } = req.body;

      if (!number || !capacity) {
        return res.status(400).json({ message: 'Table number and capacity are required' });
      }

      const table = new Table({
        number: parseInt(number),
        capacity: parseInt(capacity),
        status: 'available'
      });

      await table.save();
      const tableObj = table.toObject ? table.toObject() : table;
      return res.status(201).json({
        ...tableObj,
        _id: tableObj._id?.toString() || tableObj._id
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Tables error:', error);
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
