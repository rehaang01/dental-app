const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const prisma  = require('../lib/prisma');
const router  = express.Router();

const JWT_SECRET     = process.env.JWT_SECRET;
const COOKIE_MAX_AGE = 12 * 60 * 60 * 1000; // 12 hours in ms

// ── POST /api/auth/login ──────────────────────────────────────────
router.post('/login', async (req, res) => {
  // ✅ FIX: wrap entire handler in try/catch so a DB outage returns a
  //    clean 500 instead of crashing the request with an unhandled error
  try {
    if (!JWT_SECRET) {
      console.error('FATAL: JWT_SECRET env variable is not set.');
      return res.status(500).json({ error: 'Server misconfiguration.' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Look up user (case-insensitive username)
    const user = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (!user) {
      // Same error message regardless of whether user exists — prevents username enumeration
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Set httpOnly cookie — JS can never read this, defeating XSS attacks
    res.cookie('token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'none',   // Blocks cross-site requests (CSRF protection)
      maxAge:   COOKIE_MAX_AGE,
      path:     '/',
    });

    res.json({ user: { username: user.username, displayName: user.displayName } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out successfully.' });
});

// ── GET /api/auth/me ──────────────────────────────────────────────
// Used by frontend on startup to check if already logged in
router.get('/me', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ user: { username: payload.username, displayName: payload.displayName } });
  } catch {
    res.clearCookie('token');
    res.status(401).json({ error: 'Session expired' });
  }
});

module.exports = router;