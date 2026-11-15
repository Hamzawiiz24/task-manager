const { unauthorized, forbidden } = require('../errors');

const authenticate = (userService) => (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized('Please log in first');
  req.user = userService.verifyToken(token);
  next();
};

// RBAC (NFR-2)
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw forbidden('You do not have permission to do this');
  next();
};
module.exports = { authenticate, requireRole };
