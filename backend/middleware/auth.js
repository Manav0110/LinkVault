const User = require('../models/User');
const { verifyToken } = require('../utils/token');

const AUTH_SECRET = process.env.AUTH_SECRET || 'change-this-secret-in-production';

const extractBearerToken = (authHeader) => {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};

const attachUserFromToken = async (req) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) return null;

  const payload = verifyToken(token, AUTH_SECRET);
  if (!payload?.userId) return null;

  const user = await User.findById(payload.userId).select('_id name email');
  if (!user) return null;

  req.user = user;
  return user;
};

const optionalAuth = async (req, res, next) => {
  try {
    await attachUserFromToken(req);
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAuth = async (req, res, next) => {
  try {
    const user = await attachUserFromToken(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  optionalAuth,
  requireAuth
};
