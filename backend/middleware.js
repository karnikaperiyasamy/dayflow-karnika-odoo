const { verifyAuthToken } = require('./utils');
const db = require('./db');

// Requires a valid JWT (from httpOnly cookie or Authorization header).
function requireAuth(req, res, next) {
  const token = req.cookies?.dayflow_token ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    const payload = verifyAuthToken(token);
    const user = db.prepare('SELECT id, employeeId, email, role, emailVerified FROM users WHERE id = ?').get(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

// Restricts to a set of allowed roles. Backend-enforced, not just hidden UI.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
