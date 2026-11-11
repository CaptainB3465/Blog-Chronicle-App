const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/blogs - Public: retrieve all blogs
router.get('/', async (req, res, next) => {
    try {
        const blogs = await db.listBlogs();
        res.json({ blogs });
    } catch (error) {
        next(error);
    }
});

// GET /api/blogs/:id - Public: retrieve one blog
router.get('/:id', async (req, res, next) => {
    try {
        const uuidPattern =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!uuidPattern.test(req.params.id)) {
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

        const author = await db.findUserById(req.auth.id);

        if (!author) {
            return res.status(401).json({
                message: 'Author account not found.'
            });
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

module.exports = router;
