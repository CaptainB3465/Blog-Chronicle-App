const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();
const SEED_FILE = path.join(__dirname, '..', 'data', 'feedback.json');
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const FEEDBACK_FILE = isServerless ? path.join('/tmp', 'feedback.json') : SEED_FILE;

function readFeedback() {
    try {
        if (!fs.existsSync(FEEDBACK_FILE)) {
            if (fs.existsSync(SEED_FILE)) {
                const seedData = fs.readFileSync(SEED_FILE, 'utf8');
                try { fs.writeFileSync(FEEDBACK_FILE, seedData, 'utf8'); } catch (e) {}
                return JSON.parse(seedData);
            }
            try { fs.writeFileSync(FEEDBACK_FILE, '[]', 'utf8'); } catch (e) {}
            return [];
        }
        const data = fs.readFileSync(FEEDBACK_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.warn('Error reading feedback file:', e.message);
        return [];
    }
}

function writeFeedback(list) {
    try {
        fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
        console.warn('Feedback write notice:', e.message);
    }
}

// GET /api/feedback - List feedback, optional ?authorId=, ?clientId=, ?blogId=
router.get('/', (req, res) => {
    try {
        let list = readFeedback();
        const { authorId, clientId, blogId } = req.query;

        if (authorId) {
            list = list.filter(f => f.authorId === authorId || (f.authorName && req.query.authorName && f.authorName.toLowerCase() === req.query.authorName.toLowerCase()));
        }
        if (clientId) {
            list = list.filter(f => f.clientId === clientId);
        }
        if (blogId) {
            list = list.filter(f => f.blogId === blogId);
        }

        // Sort latest first
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ feedback: list });
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve feedback.' });
    }
});

// POST /api/feedback - Submit new feedback / comment on an author's post
router.post('/', async (req, res) => {
    try {
        const {
            blogId,
            blogTitle,
            authorId,
            authorName,
            clientId,
            clientName,
            clientAvatar,
            type,
            rating,
            message
        } = req.body || {};

        if (!blogId || !message || !String(message).trim()) {
            return res.status(400).json({ message: 'blogId and message are required.' });
        }

        const list = readFeedback();
        const newEntry = {
            id: 'fb-' + (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)),
            blogId: String(blogId),
            blogTitle: blogTitle || 'Untitled Story',
            authorId: authorId || '',
            authorName: authorName || 'Chronicle Author',
            clientId: clientId || 'client-' + Date.now(),
            clientName: clientName || 'Anonymous Reader',
            clientAvatar: clientAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName || 'Reader')}&background=c95123&color=fff`,
            type: type || 'General Feedback',
            rating: Number(rating) || 5,
            message: String(message).trim(),
            status: 'Pending',
            authorReply: null,
            createdAt: new Date().toISOString()
        };

        list.unshift(newEntry);
        writeFeedback(list);

        // Also add comment to local blogs if available
        try {
            if (fs.existsSync(BLOGS_FILE)) {
                const blogs = JSON.parse(fs.readFileSync(BLOGS_FILE, 'utf8'));
                const blog = blogs.find(b => b.id === blogId);
                if (blog) {
                    blog.comments = blog.comments || [];
                    blog.comments.push({
                        id: newEntry.id,
                        author: newEntry.clientName,
                        avatar: newEntry.clientAvatar,
                        content: newEntry.message,
                        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    });
                    fs.writeFileSync(BLOGS_FILE, JSON.stringify(blogs, null, 2), 'utf8');
                }
            }
        } catch (bErr) {
            console.warn('Could not mirror comment to blog:', bErr.message);
        }

        res.status(201).json({ feedback: newEntry });
    } catch (err) {
        res.status(500).json({ message: 'Failed to save feedback: ' + err.message });
    }
});

// PUT /api/feedback/:id - Update status or reply
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status, authorReply } = req.body || {};

        const list = readFeedback();
        const idx = list.findIndex(f => f.id === id);

        if (idx === -1) {
            return res.status(404).json({ message: 'Feedback not found.' });
        }

        if (status) list[idx].status = status;
        if (authorReply !== undefined) list[idx].authorReply = authorReply;

        writeFeedback(list);
        res.json({ feedback: list[idx] });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update feedback: ' + err.message });
    }
});

// DELETE /api/feedback/:id - Remove feedback
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        let list = readFeedback();
        const initialLen = list.length;
        list = list.filter(f => f.id !== id);

        if (list.length === initialLen) {
            return res.status(404).json({ message: 'Feedback not found.' });
        }

        writeFeedback(list);
        res.json({ message: 'Feedback deleted successfully.', id });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete feedback.' });
    }
});

module.exports = router;
