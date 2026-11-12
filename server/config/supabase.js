const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
    throw new Error('[SUPABASE] Missing SUPABASE_URL environment variable.');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[SUPABASE] Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
}

// Initialize server-side Supabase client
const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    }
);

console.log('[SUPABASE] Server-side database client initialized.');

module.exports = supabase;
