const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Verifies the Bearer JWT in the Authorization header.
 * Attaches decoded user payload to req.user.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided. Authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid token. Authorization denied.';
    return res.status(401).json({ success: false, message });
  }
};

/**
 * Middleware factory: Restricts access to specific roles.
 * Usage: authorize('admin', 'staff')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${roles.join(', ')}.`,
    });
  }
  next();
};

module.exports = { protect, authorize };