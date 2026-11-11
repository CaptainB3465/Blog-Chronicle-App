const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/blogs  (public)
router.get('/', (req, res) => {
  res.json({ blogs: db.read('blogs') });
});

// GET /api/blogs/:id (public)
router.get('/:id', (req, res) => {
  const blog = db.read('blogs').find((b) => b.id === req.params.id);
  if (!blog) return res.status(404).json({ message: 'Blog not found.' });
  res.json({ blog });
});

// POST /api/blogs  (auth required)
router.post('/', requireAuth, (req, res) => {
  const { title, excerpt, content, category, coverImage, tags } = req.body || {};
  if (!title || !String(title).trim() || !content || !String(content).trim()) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const author = db.read('users').find((u) => u.id === req.auth.id);
  if (!author) return res.status(401).json({ message: 'Author account not found.' });

  const words = String(content).replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
  const cleanTitle = String(title).trim();
  const blog = {
    id: 'post-' + Date.now(),
    title: cleanTitle,
    slug: cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    excerpt: (excerpt && String(excerpt).trim()) || cleanTitle,
    content: String(content),
    category: category || 'Engineering',
    coverImage: coverImage || '',
    publishedAt: 'Just now',
    createdAt: new Date().toISOString(),
    readingTime: Math.max(1, Math.round(words / 180)),
    featured: false,
    trending: true,
    likes: 0,
    claps: 0,
    authorId: author.id,
    author: { name: author.name, role: author.role, avatar: author.avatar },
    tags: Array.isArray(tags) && tags.length ? tags : [category || 'Engineering'],
    comments: []
  };

  const blogs = db.read('blogs');
  blogs.unshift(blog);
  db.write('blogs', blogs);
  res.status(201).json({ blog });
});

module.exports = router;
