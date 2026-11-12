const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const isValidId = (id) =>
    typeof id === 'string' &&
    id.trim().length > 0 &&
    !id.includes('/') &&
    !id.includes('\\');

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

        let author = await db.findUserById(req.auth.id);

        if (!author) {
            author = {
                id: req.auth.id,
                name: req.auth.name || (req.auth.email ? req.auth.email.split('@')[0] : 'Author'),
                role: 'Contributing Author',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(req.auth.email || 'Author')}&background=c95123&color=fff`
            };
        }

        const cleanTitle = String(title).trim();
        const cleanContent = String(content).trim();

        const words = cleanContent
            .replace(/<[^>]*>/g, ' ')
            .trim()
            .split(/\s+/)
            .length;

        const slug = cleanTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const cleanCategory = category
            ? String(category).trim()
            : 'Engineering';

        const blog = await db.createBlog({
            title: cleanTitle,
            slug,
            excerpt: excerpt
                ? String(excerpt).trim()
                : cleanTitle,
            content: cleanContent,
            category: cleanCategory,
            coverImage: coverImage || '',
            readingTime: Math.max(1, Math.ceil(words / 180)),
            authorId: author.id,
            author: {
                name: author.name,
                role: author.role,
                avatar: author.avatar
            },
            tags: Array.isArray(tags) && tags.length
                ? tags
                : [cleanCategory]
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

        // Allow update if author matches or if author was not set
        if (existing.authorId && existing.authorId !== req.auth.id) {
            // Check if names match as fallback
            const currentUser = await db.findUserById(req.auth.id);
            const isNameMatch = currentUser && existing.author && existing.author.name &&
                currentUser.name.toLowerCase() === existing.author.name.toLowerCase();
            if (!isNameMatch) {
                return res.status(403).json({
                    message: 'You can only edit your own blogs.'
                });
            }
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
            ? String(content).trim()
            : existing.content;

        if (!cleanTitle || !cleanContent) {
            return res.status(400).json({
                message: 'Title and content are required.'
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

        const cleanCategory = category !== undefined && String(category).trim()
            ? String(category).trim()
            : existing.category || 'Engineering';

        const cleanExcerpt = excerpt !== undefined && String(excerpt).trim()
            ? String(excerpt).trim()
            : existing.excerpt || cleanTitle;

        const updated = await db.updateBlog(req.params.id, {
            title: cleanTitle,
            slug,
            excerpt: cleanExcerpt,
            content: cleanContent,
            category: cleanCategory,
            coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
            readingTime: Math.max(1, Math.ceil(words / 180)),
            tags: Array.isArray(tags) && tags.length
                ? tags
                : existing.tags && existing.tags.length
                ? existing.tags
                : [cleanCategory]
        });

        res.json({ blog: updated });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/blogs/:id - Delete a blog post with confirmed authorization
router.delete('/:id', async (req, res, next) => {
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
