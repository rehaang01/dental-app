require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit   = require('express-rate-limit');

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
app.use('/api/auth/login',  loginLimiter);
app.use('/api/auth',        authRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Protected routes — requireAuth runs before all of these ───────
app.use('/api/patients',  requireAuth, patientsRouter);
app.use('/api/visits',    requireAuth, visitsRouter);
app.use('/api/billing',   requireAuth, billingRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);

const PORT = process.env.PORT || 3001;
const { initWhatsApp } = require('./services/whatsapp');
initWhatsApp();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});