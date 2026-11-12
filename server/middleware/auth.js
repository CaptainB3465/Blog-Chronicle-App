const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}

function signToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role || 'Author',
            name: user.name || user.username || 'User'
        },
        JWT_SECRET,
        {
            algorithm: 'HS256',
            expiresIn: '7d'
        }
    );
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';

    const token = header.startsWith('Bearer ')
        ? header.slice(7).trim()
        : null;

    if (!token) {
        return res.status(401).json({
            message: 'Authentication required.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ['HS256']
        });

        if (!decoded.id || !decoded.email) {
            return res.status(401).json({
                message: 'Invalid authentication token.'
            });
        }

        req.auth = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token.'
        });
    }
}

module.exports = { signToken, requireAuth };
