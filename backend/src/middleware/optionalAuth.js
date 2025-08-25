const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next(); // guest → continue without user

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    req.userDoc = await User.findById(decoded.id).select('-password');
  } catch (err) {
    // invalid token → treat as guest, don’t block
  }
  next();
};
