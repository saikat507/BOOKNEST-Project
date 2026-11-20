const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

// Verify token - required
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if authorization header exists
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  // Extract token from Bearer scheme
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'role', 'is_active']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists'
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

// Optional token verification - doesn't require token
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // If no authorization header, continue without user
  if (!authHeader) {
    return next();
  }

  // Extract token from Bearer scheme
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  // Verify token if provided
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'role', 'is_active']
    });

    if (user && user.is_active !== false) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
    }
  } catch (error) {
    // Silently skip error - continue without user
    console.warn('Optional token verification failed:', error.message);
  }

  next();
};

module.exports = {
  verifyToken,
  requireAuth: verifyToken,
  optionalAuth
};
