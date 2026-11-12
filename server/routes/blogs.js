const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sanitizeHtml } = require('../utils/sanitizer');

const router = express.Router();

const APPROVED_CATEGORIES = [
    'Engineering',
    'Design',
    'Design & UX',
    'AI',
    'Artificial Intelligence',
    'Culture',
    'Technology',
    'Productivity'
];

const isValidId = (id) =>
    typeof id === 'string' &&
    id.trim().length > 0 &&
    !id.includes('/') &&
    !id.includes('\\');

function validateCategory(cat) {
    if (!cat) return null;
    const clean = String(cat).trim();
    return APPROVED_CATEGORIES.find(c => c.toLowerCase() === clean.toLowerCase()) || null;
}

function isValidImageUrl(url) {
    if (!url || !String(url).trim()) return true;
    try {
        const parsed = new URL(String(url).trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

function validateTags(rawTags, defaultCategory) {
    let tagList = [];
    if (Array.isArray(rawTags)) {
        tagList = rawTags;
    } else if (typeof rawTags === 'string' && rawTags.trim()) {
        tagList = rawTags.split(',').map(t => t.trim());
    }

    const cleanTags = tagList
        .map(t => String(t).trim().replace(/^#/, '').replace(/[<>{}[\]]/g, ''))
        .filter(t => t.length > 0 && t.length <= 30)
        .slice(0, 10);

    return cleanTags.length > 0 ? cleanTags : [defaultCategory];
}

// GET /api/blogs - Public: retrieve all blogs (supports ?search= & ?category= & ?tag=)
router.get('/', async (req, res, next) => {
    try {
        const { search, category, tag } = req.query;
        let blogs = await db.listBlogs({ search, category });

        if (tag && String(tag).trim()) {
            const cleanTag = String(tag).trim().toLowerCase().replace(/^#/, '');
            blogs = blogs.filter(b =>
                Array.isArray(b.tags) &&
                b.tags.some(t => String(t).toLowerCase().replace(/^#/, '') === cleanTag)
            );
        }

        res.json({ blogs });
    } catch (error) {
        next(error);
    }
});

// GET /api/blogs/user/me - Authenticated: retrieve only the logged-in user's blogs
router.get('/user/me', requireAuth, async (req, res, next) => {
    try {
        const all = await db.listBlogs();
        // Strictly filter by immutable authorId - no name-based fallback
        const userBlogs = all.filter(b => b.authorId === req.auth.id);

        res.json({ blogs: userBlogs, count: userBlogs.length });
    } catch (error) {
        next(error);
    }
});

// GET /api/blogs/:id - Public: retrieve one blog
router.get('/:id', async (req, res, next) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid blog ID.'
            });
        }

        const blog = await db.getBlog(req.params.id);

        if (!blog) {
            return res.status(404).json({
                message: 'Blog not found.'
            });
        }

        res.json({ blog });
    } catch (error) {
        next(error);
    }
});

// POST /api/blogs - Authenticated users can create blogs
router.post('/', requireAuth, async (req, res, next) => {
    try {
        const {
            title,
            excerpt,
            content,
            category,
            coverImage,
            tags
        } = req.body || {};

        if (
            !title ||
            !String(title).trim() ||
            !content ||
            !String(content).trim()
        ) {
            return res.status(400).json({
                message: 'Title and content are required.'
            });
        }

        let cleanCategory = 'Engineering';
        if (category) {
            const matchedCategory = validateCategory(category);
            if (!matchedCategory) {
                return res.status(400).json({
                    message: `Invalid category. Approved categories: ${APPROVED_CATEGORIES.join(', ')}.`
                });
            }
            cleanCategory = matchedCategory;
        }

        if (coverImage && !isValidImageUrl(coverImage)) {
            return res.status(400).json({
                message: 'Invalid cover image URL. Must be a valid HTTP or HTTPS URL.'
            });
        }

        const author = await db.findUserById(req.auth.id);

        if (!author) {
            return res.status(401).json({
                message: 'Authenticated author record not found.'
            });
        }

        const cleanTitle = String(title).trim();
        const cleanContent = sanitizeHtml(String(content).trim());
        const cleanExcerpt = excerpt
            ? sanitizeHtml(String(excerpt).trim())
            : cleanTitle;

        const words = cleanContent
            .replace(/<[^>]*>/g, ' ')
            .trim()
            .split(/\s+/)
            .length;

        const slug = cleanTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const cleanTags = validateTags(tags, cleanCategory);

        const blog = await db.createBlog({
            title: cleanTitle,
            slug,
            excerpt: cleanExcerpt,
            content: cleanContent,
            category: cleanCategory,
            coverImage: coverImage ? String(coverImage).trim() : '',
            readingTime: Math.max(1, Math.ceil(words / 180)),
            authorId: author.id,
            author: {
                name: author.name,
                role: author.role,
                avatar: author.avatar
            },
            tags: cleanTags
        });

        res.status(201).json({ blog });

    } catch (error) {
        next(error);
    }
});

// PUT /api/blogs/:id - Authenticated author can update their blog
router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid blog ID.'
            });
        }

        const existing = await db.getBlog(req.params.id);

        if (!existing) {
            return res.status(404).json({
                message: 'Blog not found.'
            });
        }

        // Ownership verification: user can only modify their own blogs.
        // Role-based authorization: Admins are permitted to modify any blog.
        const isAdmin = req.auth && req.auth.role === 'Admin';
        if (!isAdmin && (!existing.authorId || existing.authorId !== req.auth.id)) {
            return res.status(403).json({
                message: 'You can only modify your own blogs.'
            });
        }

        const {
            title,
            excerpt,
            content,
            category,
            coverImage,
            tags
        } = req.body || {};

        const cleanTitle = title !== undefined
            ? String(title).trim()
            : existing.title;
        const cleanContent = content !== undefined
            ? sanitizeHtml(String(content).trim())
            : existing.content;

        if (!cleanTitle || !cleanContent) {
            return res.status(400).json({
                message: 'Title and content are required.'
            });
        }

        // Validate category if provided
        let cleanCategory = existing.category || 'Engineering';
        if (category !== undefined) {
            const matchedCategory = validateCategory(category);
            if (!matchedCategory) {
                return res.status(400).json({
                    message: `Invalid category. Approved categories: ${APPROVED_CATEGORIES.join(', ')}.`
                });
            }
            cleanCategory = matchedCategory;
        }

        // Validate cover image if provided
        if (coverImage !== undefined && coverImage && !isValidImageUrl(coverImage)) {
            return res.status(400).json({
                message: 'Invalid cover image URL. Must be a valid HTTP or HTTPS URL.'
            });
        }

        const words = cleanContent
            .replace(/<[^>]*>/g, ' ')
            .trim()
            .split(/\s+/)
            .length;

        const slug = cleanTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const cleanExcerpt = excerpt !== undefined && String(excerpt).trim()
            ? sanitizeHtml(String(excerpt).trim())
            : existing.excerpt || cleanTitle;

        const cleanTags = tags !== undefined
            ? validateTags(tags, cleanCategory)
            : (existing.tags && existing.tags.length ? existing.tags : [cleanCategory]);

        const updated = await db.updateBlog(req.params.id, {
            title: cleanTitle,
            slug,
            excerpt: cleanExcerpt,
            content: cleanContent,
            category: cleanCategory,
            coverImage: coverImage !== undefined ? String(coverImage).trim() : existing.coverImage,
            readingTime: Math.max(1, Math.ceil(words / 180)),
            tags: cleanTags
        });

        res.json({ blog: updated });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/blogs/:id - Authenticated author can delete their blog post
router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid blog ID.'
            });
        }

        const existing = await db.getBlog(req.params.id);

        if (!existing) {
            return res.status(404).json({
                message: 'Blog not found.'
            });
        }

        // Ownership verification: user can only delete their own blogs.
        // Role-based authorization: Admins are permitted to delete any blog.
        const isAdmin = req.auth && req.auth.role === 'Admin';
        if (!isAdmin && (!existing.authorId || existing.authorId !== req.auth.id)) {
            return res.status(403).json({
                message: 'You can only modify your own blogs.'
            });
        }

        await db.deleteBlog(req.params.id);

        res.json({
            message: 'Blog deleted successfully.',
            id: req.params.id
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
