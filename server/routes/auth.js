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
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body || {};

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email and password are required.'
            });
        }

        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim().toLowerCase();

        if (!cleanName) {
            return res.status(400).json({
                message: 'Name cannot be empty.'
            });
        }

        if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
            return res.status(400).json({
                message: 'Invalid email address.'
            });
        }

        if (String(password).length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters.'
            });
        }

        if (await db.findUserByEmail(cleanEmail)) {
            return res.status(409).json({
                message: 'An account with this email already exists.'
            });
        }

        const user = await db.createUser({
            name: cleanName,
            email: cleanEmail,
            role: 'Author & Contributor',
            avatar: avatarFor(cleanName),
            passwordHash: await bcrypt.hash(String(password), 10)
        });

        res.status(201).json({
            token: signToken(user),
            user: publicUser(user)
        });

    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const user = await db.findUserByEmail(
            String(email).trim().toLowerCase()
        );

        if (!user || !(await bcrypt.compare(
            String(password),
            user.passwordHash
        ))) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        res.json({
            token: signToken(user),
            user: publicUser(user)
        });

    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const user = await db.findUserById(req.auth.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        res.json({ user: publicUser(user) });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
