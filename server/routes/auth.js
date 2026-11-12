const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// In-memory verification token cache for password recovery (15 minute TTL)
const resetTokens = new Map();

// Rate limiter for authentication endpoints (protects against brute-force & credential stuffing)
const authAttempts = new Map();
function rateLimitAuth(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.ip || 'local';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 25;

    const record = authAttempts.get(ip) || { count: 0, resetAt: now + windowMs };
    if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + windowMs;
    }

    record.count += 1;
    authAttempts.set(ip, record);

    if (record.count > maxAttempts) {
        return res.status(429).json({
            message: 'Too many authentication attempts. Please try again in 15 minutes.'
        });
    }
    next();
}

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
router.post('/register', rateLimitAuth, async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body || {};

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

        // Security: The backend strictly assigns the default role itself, ignoring any role sent by the client
        const cleanRole = 'Author';

        const user = await db.createUser({
            name: cleanName,
            email: cleanEmail,
            role: cleanRole,
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
router.post('/login', rateLimitAuth, async (req, res, next) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const user = await db.findUserByEmail(cleanEmail);

        if (!user) {
            console.warn(`[AUTH] Login failed: No user found for ${cleanEmail}`);
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const cleanPass = String(password);
        const isPasswordMatch = Boolean(
            user.passwordHash && await bcrypt.compare(cleanPass, user.passwordHash)
        );

        if (!isPasswordMatch) {
            console.warn(`[AUTH] Login failed: Password mismatch for ${cleanEmail}`);
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        console.log(`[AUTH] Login successful: ${user.name} (${user.email}) [Role: ${user.role}]`);
        res.json({
            token: signToken(user),
            user: publicUser(user)
        });

    } catch (error) {
        next(error);
    }
});

// POST /api/auth/forgot-password - Step 1: Request verified recovery code
router.post('/forgot-password', rateLimitAuth, async (req, res, next) => {
    try {
        const { email } = req.body || {};
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }
        const cleanEmail = String(email).trim().toLowerCase();
        const user = await db.findUserByEmail(cleanEmail);

        if (!user) {
            return res.json({
                message: 'If an account exists with this email, a verification code has been dispatched.'
            });
        }

        // Generate cryptographically random 6-digit recovery code
        const resetCode = crypto.randomInt(100000, 999999).toString();
        resetTokens.set(cleanEmail, {
            code: resetCode,
            expires: Date.now() + 15 * 60 * 1000 // 15 mins
        });

        console.log(`[AUTH RECOVERY] Verification code for ${cleanEmail}: ${resetCode}`);

        res.json({
            message: 'If an account exists with this email, a verification code has been dispatched.',
            ...(process.env.NODE_ENV !== 'production' ? { recoveryCode: resetCode } : {})
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/reset-password - Step 2: Verify recovery code and set new password
router.post('/reset-password', rateLimitAuth, async (req, res, next) => {
    try {
        const { email, resetCode, newPassword } = req.body || {};
        if (!email || !resetCode || !newPassword) {
            return res.status(400).json({
                message: 'Email, verification code, and new password are required.'
            });
        }
        const cleanEmail = String(email).trim().toLowerCase();
        if (String(newPassword).length < 8) {
            return res.status(400).json({
                message: 'New password must be at least 8 characters.'
            });
        }

        const record = resetTokens.get(cleanEmail);
        if (!record || record.expires < Date.now() || record.code !== String(resetCode).trim()) {
            return res.status(401).json({
                message: 'Invalid or expired verification code. Please request a new code.'
            });
        }

        const user = await db.findUserByEmail(cleanEmail);
        if (!user) {
            return res.status(404).json({ message: 'No account registered with this email.' });
        }

        const newHash = await bcrypt.hash(String(newPassword), 10);
        await db.updateUserPassword(cleanEmail, newHash);
        resetTokens.delete(cleanEmail);

        console.log(`[AUTH] Password reset successfully for ${cleanEmail}`);
        res.json({
            success: true,
            message: 'Password updated successfully. You can now log in.'
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/auth/password - Authenticated user password update
router.put('/password', requireAuth, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required.'
            });
        }

        if (String(newPassword).length < 8) {
            return res.status(400).json({
                message: 'New password must be at least 8 characters.'
            });
        }

        const user = await db.findUserById(req.auth.id);
        if (!user || !user.passwordHash) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(String(currentPassword), user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        const newHash = await bcrypt.hash(String(newPassword), 10);
        await db.updateUserPassword(user.email, newHash);

        res.json({ message: 'Password updated successfully.' });
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

// PUT /api/auth/profile - Update user profile information
router.put('/profile', requireAuth, async (req, res, next) => {
    try {
        const { name, avatar, role } = req.body || {};

        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: 'Name cannot be empty.' });
        }

        // Security: Users must not be allowed to change their own role
        if (role && role !== req.auth.role) {
            return res.status(403).json({
                message: 'Users are not permitted to change their own role.'
            });
        }

        const updated = await db.updateUserProfile(req.auth.id, {
            name: String(name).trim(),
            avatar: avatar ? String(avatar).trim() : undefined
        });

        if (!updated) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            message: 'Profile updated successfully.',
            user: publicUser(updated)
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
