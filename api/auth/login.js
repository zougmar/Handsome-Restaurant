const { connectToDatabase } = require('../_lib/mongodb');
const { generateToken } = require('../_lib/auth');
const { getUserModel } = require('../_lib/models');
const { body, validationResult } = require('express-validator');

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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    const User = getUserModel();

    // Validation
    await Promise.all([
      body('email').isEmail().withMessage('Please provide a valid email').run(req),
      body('password').notEmpty().withMessage('Password is required').run(req)
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // Convert user to plain object
    const userObj = user.toObject ? user.toObject() : user;
    
    res.status(200).json({
      token,
      user: {
        id: userObj._id?.toString() || userObj._id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
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
