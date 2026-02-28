import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

// We can disable row level security or auth checks by creating a privileged client if necessary down the line,
// but anon key works fine if RLS policies allow public read or we pass a token.
export const supabase = createClient(supabaseUrl, supabaseKey);
