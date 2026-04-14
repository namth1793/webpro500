require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 5017;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API routes
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/admin',    require('./routes/admin'));

// SPA fallback — serve admin.html for /admin*, index.html for everything else
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'admin.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  WebPro server: http://localhost:${PORT}`);
  console.log(`  Admin panel:   http://localhost:${PORT}/admin`);
  console.log(`  Login:         admin / admin123\n`);
});
