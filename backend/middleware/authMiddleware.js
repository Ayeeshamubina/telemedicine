const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'medibridge_super_secret_jwt_key_2026_telemedicine'
      );

      // Special handling for admin env credentials
      if (decoded.role === 'admin' && decoded.id === 'system-admin') {
        req.user = {
          _id: 'system-admin',
          name: 'MEDIBRIDGE Administrator',
          email: process.env.ADMIN_EMAIL || 'admin@medibridge.org',
          role: 'admin',
          status: 'active'
        };
        return next();
      }

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User account not found' });
      }

      if (req.user.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Account has been suspended. Please contact support.' });
      }

      next();
    } catch (error) {
      console.error('[Auth Error] Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no authorization token provided' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
