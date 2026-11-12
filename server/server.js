require('dotenv').config();
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Sync remote Supabase records into local cache on standalone boot (skip in serverless cold start)
if (!process.env.VERCEL) {
  db.syncFromSupabase().catch(e => console.warn('[BOOT] Supabase initial sync notice:', e.message));
}

// Production HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/feedback', require('./routes/feedback'));

app.use('/api', (req, res) => res.status(404).json({ message: 'Not found.' }));

// Serve the frontend from the project root
const root = path.join(__dirname, '..');
app.use(express.static(root));

const PAGES = ['index', 'login', 'register', 'dashboard', 'create-blog', 'blog'];
PAGES.forEach(page => {
  app.get(`/${page}`, (req, res) => res.sendFile(path.join(root, `${page}.html`)));
  app.get(`/${page}.html`, (req, res) => res.sendFile(path.join(root, `${page}.html`)));
});
app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Chronicle server running at http://localhost:${PORT}`));
}

module.exports = app;
