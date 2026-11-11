require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogs', require('./routes/blogs'));

app.use('/api', (req, res) => res.status(404).json({ message: 'Not found.' }));

// Serve the frontend from the project root
const root = path.join(__dirname, '..');
app.use('/css', express.static(path.join(root, 'css')));
app.use('/js', express.static(path.join(root, 'js')));
app.use('/assets', express.static(path.join(root, 'assets')));
app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));
const PAGES = ['index', 'login', 'register', 'dashboard', 'create-blog', 'blog'];
app.get(/^\/([a-z-]+)(?:\.html)?$/, (req, res, next) => {
  const page = req.params[0];
  if (!PAGES.includes(page)) return next();
  res.sendFile(path.join(root, page + '.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(PORT, () => console.log(`Chronicle server running at http://localhost:${PORT}`));
