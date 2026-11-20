// Higher-order function that returns middleware to check user roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be attached by verifyToken middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user's role is in the allowed roles array
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // User has required role, proceed
    next();
  };
};

const requireAdmin = requireRole('admin');

module.exports = { requireRole, requireAdmin };
