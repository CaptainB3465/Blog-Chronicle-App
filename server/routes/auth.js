const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

const avatarFor = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=c95123&color=fff&size=128&bold=true`;

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatar: u.avatar,
  isLoggedIn: true
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  const users = db.read('users');
  const cleanEmail = String(email).trim().toLowerCase();
  if (users.some((u) => u.email === cleanEmail)) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const user = {
    id: 'usr_' + Date.now(),
    name: String(name).trim(),
    email: cleanEmail,
    role: role || 'Author & Contributor',
    avatar: avatarFor(String(name).trim()),
    passwordHash: await bcrypt.hash(String(password), 10),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  db.write('users', users);

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const user = db.read('users').find((u) => u.email === String(email).trim().toLowerCase());
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.read('users').find((u) => u.id === req.auth.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: publicUser(user) });
});

module.exports = router;
