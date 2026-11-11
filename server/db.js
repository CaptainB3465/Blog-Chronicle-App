const supabase = require('./config/supabase');

// Handle Supabase responses
function check({ data, error }) {
    if (error) {
        console.error('Supabase Error:', error.message);
        throw new Error(error.message);
    }

    return data;
}

// Convert database user into application user
const toUser = (r) =>
    r && {
        id: r.id,
        name: r.username,
        email: r.email,
        role: r.role,
        avatar: r.avatar,
        passwordHash: r.password_hash
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
        coverImage: r.cover_image,
        tags: r.tags || [],
        readingTime: r.reading_time,
        likes: r.likes,
        claps: r.claps,
        featured: false,
        trending: true,

        createdAt: r.created_at,

        publishedAt: new Date(r.created_at).toLocaleDateString(
            'en-US',
            {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }
        ),

        authorId: r.author_id,

        author: {
            name: r.author_name,
            role: r.author_role,
            avatar: r.author_avatar
        },

        comments: []
    };

module.exports = {

    // FIND USER BY EMAIL
    async findUserByEmail(email) {
        const result = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        return toUser(check(result));
    },

    // FIND USER BY ID
    async findUserById(id) {
        const result = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        return toUser(check(result));
    },

    // CREATE USER
    async createUser(u) {
        const row = {
            username: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
            password_hash: u.passwordHash
        };

        const result = await supabase
            .from('users')
            .insert(row)
            .select()
            .single();

        return toUser(check(result));
    },

    // GET ALL BLOGS
    async listBlogs() {
        const result = await supabase
            .from('blogs')
            .select('*')
            .order('created_at', {
                ascending: false
            });

        return check(result).map(toBlog);
    },

    // GET SINGLE BLOG
    async getBlog(id) {
        const result = await supabase
            .from('blogs')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        return toBlog(check(result));
    },

    // CREATE BLOG
    async createBlog(b) {
        const row = {
            title: b.title,
            slug: b.slug,
            excerpt: b.excerpt,
            content: b.content,
            category: b.category,
            cover_image: b.coverImage,
            tags: b.tags,
            reading_time: b.readingTime,

            author_id: b.authorId,
            author_name: b.author.name,
            author_role: b.author.role,
            author_avatar: b.author.avatar
        };

        const result = await supabase
            .from('blogs')
            .insert(row)
            .select()
            .single();

        return toBlog(check(result));
    }
};
