const jwt = require('jsonwebtoken');
const path = require('path');
const User = require(path.join(process.cwd(), 'backend', 'models', 'User'));

// Generate JWT token
function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    { expiresIn: '7d' }
  );
}

// Verify JWT token
async function verifyToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
    );

    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

module.exports = { generateToken, verifyToken };
