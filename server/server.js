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

// Explicit static file and page routes so Vercel @vercel/nft traces and bundles all frontend assets
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.get('/index', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'login.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '..', 'login.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '..', 'dashboard.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'dashboard.html')));
app.get('/create-blog', (req, res) => res.sendFile(path.join(__dirname, '..', 'create-blog.html')));
app.get('/create-blog.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'create-blog.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, '..', 'blog.html')));
app.get('/blog.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'blog.html')));
app.get('/css/styles.css', (req, res) => res.sendFile(path.join(__dirname, '..', 'css', 'styles.css')));
app.get('/js/auth.js', (req, res) => res.sendFile(path.join(__dirname, '..', 'js', 'auth.js')));
app.get('/js/app.js', (req, res) => res.sendFile(path.join(__dirname, '..', 'js', 'app.js')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Chronicle server running at http://localhost:${PORT}`));
}

module.exports = app;
