const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Prefer the server-only service_role key (works with RLS enabled, keeps password hashes private).
// Falls back to the publishable key, which only works if you add RLS policies for the anon role.
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
);

module.exports = supabase;
