const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function requireAuth(req, res, next) {
  if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET env variable is not set.');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, username, role }
    next();
  } catch (err) {
    // Token expired or tampered
    res.clearCookie('token');
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
};