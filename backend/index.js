require('dotenv').config();
const express = require('express');
const cors = require('cors');

const patientsRouter  = require('./routes/patients');
const visitsRouter    = require('./routes/visits');
const billingRouter   = require('./routes/billing');
const dashboardRouter = require('./routes/dashboard');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/patients',  patientsRouter);
app.use('/api/visits',    visitsRouter);
app.use('/api/billing',   billingRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
const { initWhatsApp } = require('./services/whatsapp');
initWhatsApp();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});