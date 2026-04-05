require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');

const authRouter      = require('./routes/auth');
const patientsRouter  = require('./routes/patients');
const visitsRouter    = require('./routes/visits');
const billingRouter   = require('./routes/billing');
const dashboardRouter = require('./routes/dashboard');
const requireAuth     = require('./middleware/auth');

const app = express();

// ── CORS: only allow your frontend origin ─────────────────────────
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin:      ALLOWED_ORIGIN,
  credentials: true, // Required for cookies to be sent cross-origin
}));

app.use(express.json());
app.use(cookieParser());

// ── Rate limiting on login: max 10 attempts per 15 min per IP ─────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      10,
  message:  { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Public routes (no auth required) ─────────────────────────────
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth',       authRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Protected routes — requireAuth runs before all of these ───────
app.use('/api/patients',  requireAuth, patientsRouter);
app.use('/api/visits',    requireAuth, visitsRouter);
app.use('/api/billing',   requireAuth, billingRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);

// ── WhatsApp — only initialise when explicitly enabled ────────────
// ✅ FIX: previously initWhatsApp() was called unconditionally, which
//    forced a QR-code scan on every startup and could crash the server
//    if the WhatsApp library failed to initialise.
//
//    Set ENABLE_WHATSAPP=true in your .env to turn it on.
//    Leave it unset (or set to anything else) to skip it entirely.
if (process.env.ENABLE_WHATSAPP === 'true') {
  const { initWhatsApp } = require('./services/whatsapp');
  initWhatsApp();
  console.log('📱 WhatsApp initialising — scan the QR code if prompted.');
} else {
  console.log('ℹ️  WhatsApp disabled. Set ENABLE_WHATSAPP=true in .env to enable.');
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});