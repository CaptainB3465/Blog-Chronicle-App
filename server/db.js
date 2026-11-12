const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const supabase = require('./config/supabase');

const SEED_DIR = path.join(__dirname, 'data');
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? path.join('/tmp', 'chronicle_data') : SEED_DIR;
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BLOGS_FILE = path.join(DATA_DIR, 'blogs.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {}
}

function readJson(filePath, fallback = []) {
    try {
        if (!fs.existsSync(filePath)) {
            const filename = path.basename(filePath);
            const seedPath = path.join(SEED_DIR, filename);
            if (fs.existsSync(seedPath)) {
                const data = fs.readFileSync(seedPath, 'utf8');
                try { fs.writeFileSync(filePath, data, 'utf8'); } catch (e) {}
                return JSON.parse(data);
            }
            try { fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8'); } catch (e) {}
            return fallback;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.warn(`Error reading ${filePath}:`, e.message);
        return fallback;
    }
}

function writeJson(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.warn(`File write notice for ${filePath}:`, e.message);
    }
}

// Convert database user into application user
const toUser = (r) =>
    r && {
        id: r.id,
        name: r.username || r.name,
        email: r.email,
        role: r.role,
        avatar: r.avatar,
        passwordHash: r.password_hash || r.passwordHash
    };

// Convert database blog into application blog
const toBlog = (r) =>
    r && {
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
        content: r.content,
        category: r.category,
        coverImage: r.cover_image || r.coverImage,
        tags: r.tags || [],
        readingTime: r.reading_time || r.readingTime || 1,
        likes: r.likes || 0,
        claps: r.claps || 0,
        featured: r.featured || false,
        trending: r.trending !== undefined ? r.trending : true,
        createdAt: r.created_at || r.createdAt || new Date().toISOString(),
        publishedAt: (r.created_at || r.createdAt) ? new Date(r.created_at || r.createdAt).toLocaleDateString(
            'en-US',
            {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }
        ) : 'Recently',
        authorId: r.author_id || r.authorId,
        author: {
            name: (r.author && r.author.name) || r.author_name || 'Author',
            role: (r.author && r.author.role) || r.author_role || 'Contributor',
            avatar: (r.author && r.author.avatar) || r.author_avatar || 'https://ui-avatars.com/api/?name=Author&background=c95123&color=fff'
        },
        comments: r.comments || []
    };

module.exports = {

    // SYNC USERS FROM SUPABASE TO LOCAL CACHE
    async syncFromSupabase() {
        try {
            const { data, error } = await supabase.from('users').select('*');
            if (!error && Array.isArray(data) && data.length > 0) {
                const localUsers = readJson(USERS_FILE);
                const map = new Map(localUsers.map(u => [(u.email || '').toLowerCase(), u]));
                for (const remote of data) {
                    if (remote.email) {
                        map.set(remote.email.toLowerCase(), remote);
                    }
                }
                const merged = Array.from(map.values());
                writeJson(USERS_FILE, merged);
                console.log(`[DB] Synced ${data.length} users from Supabase into local cache.`);
                return merged;
            } else if (error) {
                console.warn('[DB] Supabase user sync notice:', error.message || error);
            }
        } catch (err) {
            console.warn('[DB] Supabase user sync offline/error:', err.message);
        }
        return readJson(USERS_FILE);
    },

    // UPDATE USER PASSWORD (in Supabase and local cache)
    async updateUserPassword(email, newPasswordHash) {
        const clean = String(email).trim().toLowerCase();
        let updatedInSupabase = false;
        try {
            const res = await supabase
                .from('users')
                .update({ password_hash: newPasswordHash })
                .eq('email', clean);
            if (!res.error) {
                updatedInSupabase = true;
            } else {
                console.warn('[DB] Supabase password update notice:', res.error.message || res.error);
            }
        } catch (e) {
            console.warn('[DB] Supabase password update network error:', e.message);
        }

        const users = readJson(USERS_FILE);
        const idx = users.findIndex(u => u.email && u.email.toLowerCase() === clean);
        if (idx !== -1) {
            users[idx].password_hash = newPasswordHash;
            writeJson(USERS_FILE, users);
        }
        return { success: true, updatedInSupabase };
    },

    // FIND USER BY EMAIL
    async findUserByEmail(email) {
        const clean = String(email).trim().toLowerCase();
        try {
            const result = await supabase
                .from('users')
                .select('*')
                .eq('email', clean)
                .maybeSingle();

            if (!result.error && result.data) {
                return toUser(result.data);
            } else if (result.error) {
                console.warn(`[DB] Supabase query note for ${clean}:`, result.error.message || result.error);
            }
        } catch (err) {
            // Fall back to local file
        }

        const users = readJson(USERS_FILE);
        const match = users.find(u => u.email && u.email.toLowerCase() === clean);
        return toUser(match);
    },

    // FIND USER BY ID
    async findUserById(id) {
        try {
            const result = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (!result.error && result.data) {
                return toUser(result.data);
            }
        } catch (err) {
            // Fall back to local file
        }

        const users = readJson(USERS_FILE);
        const match = users.find(u => u.id === id);
        return toUser(match);
    },

    // UPDATE USER PROFILE
    async updateUserProfile(id, updates) {
        const payload = {};
        if (updates.name) payload.username = updates.name;
        if (updates.role) payload.role = updates.role;
        if (updates.avatar) payload.avatar = updates.avatar;

        try {
            await supabase
                .from('users')
                .update(payload)
                .eq('id', id);
        } catch (e) {
            console.warn('[DB] Supabase user profile update note:', e.message);
        }

        const users = readJson(USERS_FILE);
        const idx = users.findIndex(u => u.id === id);
        if (idx !== -1) {
            if (updates.name) {
                users[idx].username = updates.name;
                users[idx].name = updates.name;
            }
            if (updates.role) users[idx].role = updates.role;
            if (updates.avatar) users[idx].avatar = updates.avatar;
            writeJson(USERS_FILE, users);
            return toUser(users[idx]);
        }
        return this.findUserById(id);
    },

    // CREATE USER
    async createUser(u) {
        const row = {
            id: u.id || crypto.randomUUID(),
            username: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
            password_hash: u.passwordHash,
            created_at: new Date().toISOString()
        };

        try {
            const result = await supabase
                .from('users')
                .insert({
                    username: u.name,
                    email: u.email,
                    role: u.role,
                    avatar: u.avatar,
                    password_hash: u.passwordHash
                })
                .select()
                .single();

            if (result.error) {
                console.error('[DB] Supabase createUser error:', result.error.message || result.error);
                if (result.error.code) {
                    throw new Error(`Database error: ${result.error.message} (${result.error.code})`);
                }
            } else if (result.data) {
                const created = toUser(result.data);
                // Mirror to local file
                const users = readJson(USERS_FILE);
                users.push(result.data);
                writeJson(USERS_FILE, users);
                return created;
            }
        } catch (err) {
            if (err.message && err.message.startsWith('Database error:')) {
                throw err;
            }
            // Fall back to local file only on network disconnect
        }

        const users = readJson(USERS_FILE);
        users.push(row);
        writeJson(USERS_FILE, users);
        return toUser(row);
    },

    // GET ALL BLOGS (with optional search & category filters)
    async listBlogs({ search, category } = {}) {
        let blogs = [];
        let supabaseSuccess = false;

        // 1. Primary authoritative query to Supabase
        try {
            let query = supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false });

            if (category && category !== 'All' && category !== 'All Stories') {
                query = query.ilike('category', String(category).trim());
            }

            const res = await query;
            if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
                blogs = res.data.map(toBlog).filter(Boolean);
                supabaseSuccess = true;
            }
        } catch (err) {
            // Fall back to local cache when offline
        }

        // 2. Offline / Cold-seed fallback only if Supabase returned no records or was unreachable
        if (!supabaseSuccess) {
            const rawBlogs = readJson(BLOGS_FILE);
            blogs = rawBlogs.map(toBlog).filter(Boolean);
        }

        if (category && category !== 'All' && category !== 'All Stories') {
            const catLower = String(category).trim().toLowerCase();
            blogs = blogs.filter(b => (b.category || '').toLowerCase() === catLower);
        }

        if (search && String(search).trim()) {
            const q = String(search).trim().toLowerCase();
            return blogs.filter((b) =>
                (b.title && b.title.toLowerCase().includes(q)) ||
                (b.excerpt && b.excerpt.toLowerCase().includes(q)) ||
                (b.content && b.content.toLowerCase().includes(q)) ||
                (b.category && b.category.toLowerCase().includes(q)) ||
                (b.author && b.author.name && b.author.name.toLowerCase().includes(q)) ||
                (Array.isArray(b.tags) && b.tags.some((t) => String(t).toLowerCase().includes(q)))
            );
        }

        return blogs;
    },

    // GET SINGLE BLOG
    async getBlog(id) {
        try {
            const result = await supabase
                .from('blogs')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (!result.error && result.data) {
                return toBlog(result.data);
            }
        } catch (err) {
            // Fall back to local file
        }

        const blogs = readJson(BLOGS_FILE);
        const match = blogs.find(b => b.id === id);
        return toBlog(match);
    },

    // CREATE BLOG
    async createBlog(b) {
        const id = b.id || crypto.randomUUID();
        const now = new Date().toISOString();

        const row = {
            id,
            title: b.title,
            slug: b.slug,
            excerpt: b.excerpt,
            content: b.content,
            category: b.category,
            cover_image: b.coverImage,
            tags: b.tags || [],
            reading_time: b.readingTime || 1,
            author_id: b.authorId,
            author_name: (b.author && b.author.name) || 'Author',
            author_role: (b.author && b.author.role) || 'Contributor',
            author_avatar: (b.author && b.author.avatar) || 'https://ui-avatars.com/api/?name=Author&background=c95123&color=fff',
            likes: 0,
            claps: 0,
            created_at: now
        };

        try {
            const result = await supabase
                .from('blogs')
                .insert({
                    title: b.title,
                    slug: b.slug,
                    excerpt: b.excerpt,
                    content: b.content,
                    category: b.category,
                    cover_image: b.coverImage,
                    tags: b.tags,
                    reading_time: b.readingTime,
                    author_id: b.authorId,
                    author_name: row.author_name,
                    author_role: row.author_role,
                    author_avatar: row.author_avatar
                })
                .select()
                .single();

            if (result.error) {
                console.error('[DB] Supabase createBlog error:', result.error.message || result.error);
                if (result.error.code) {
                    throw new Error(`Database error: ${result.error.message} (${result.error.code})`);
                }
            } else if (result.data) {
                const created = toBlog(result.data);
                const blogs = readJson(BLOGS_FILE);
                blogs.unshift(result.data);
                writeJson(BLOGS_FILE, blogs);
                return created;
            }
        } catch (err) {
            if (err.message && err.message.startsWith('Database error:')) {
                throw err;
            }
            // Fall back to local file only on network disconnect
        }

        const blogs = readJson(BLOGS_FILE);
        blogs.unshift(row);
        writeJson(BLOGS_FILE, blogs);
        return toBlog(row);
    },

    // UPDATE BLOG
    async updateBlog(id, b) {
        const rowUpdates = {
            title: b.title,
            slug: b.slug,
            excerpt: b.excerpt,
            content: b.content,
            category: b.category,
            cover_image: b.coverImage,
            tags: b.tags,
            reading_time: b.readingTime
        };

        try {
            const result = await supabase
                .from('blogs')
                .update(rowUpdates)
                .eq('id', id)
                .select()
                .maybeSingle();

            if (result.error) {
                console.error('[DB] Supabase updateBlog error:', result.error.message || result.error);
                if (result.error.code) {
                    throw new Error(`Database error: ${result.error.message} (${result.error.code})`);
                }
            } else if (result.data) {
                const updated = toBlog(result.data);
                const blogs = readJson(BLOGS_FILE);
                const idx = blogs.findIndex(item => item.id === id);
                if (idx !== -1) {
                    blogs[idx] = { ...blogs[idx], ...result.data };
                    writeJson(BLOGS_FILE, blogs);
                }
                return updated;
            }
        } catch (err) {
            if (err.message && err.message.startsWith('Database error:')) {
                throw err;
            }
            // Fall back to local file only on network disconnect
        }

        const blogs = readJson(BLOGS_FILE);
        const idx = blogs.findIndex(item => item.id === id);
        if (idx === -1) return null;

        blogs[idx] = {
            ...blogs[idx],
            ...rowUpdates,
            coverImage: b.coverImage || blogs[idx].cover_image || blogs[idx].coverImage,
            readingTime: b.readingTime || blogs[idx].reading_time || blogs[idx].readingTime
        };
        writeJson(BLOGS_FILE, blogs);
        return toBlog(blogs[idx]);
    },

    // DELETE BLOG
    async deleteBlog(id) {
        try {
            const result = await supabase
                .from('blogs')
                .delete()
                .eq('id', id);

            if (result.error) {
                console.error('[DB] Supabase deleteBlog error:', result.error.message || result.error);
                if (result.error.code) {
                    throw new Error(`Database error: ${result.error.message} (${result.error.code})`);
                }
            }
        } catch (err) {
            if (err.message && err.message.startsWith('Database error:')) {
                throw err;
            }
            // Fall back to local file only on network disconnect
        }

        const blogs = readJson(BLOGS_FILE);
        const filtered = blogs.filter(b => b.id !== id);
        writeJson(BLOGS_FILE, filtered);
        return true;
    }
};
