const { connectToDatabase } = require('../_lib/mongodb');
const { verifyToken } = require('../_lib/auth');
const { getUserModel } = require('../_lib/models');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
    const user = await verifyToken(req);

    // Convert user to plain object
    const userObj = user.toObject ? user.toObject() : user;

    res.status(200).json({
      user: {
        id: userObj._id?.toString() || userObj._id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    const errorMessage = error?.message || String(error) || 'Unauthorized';
    res.status(401).json({ 
      message: errorMessage,
      error: errorMessage
    });
  }
};
