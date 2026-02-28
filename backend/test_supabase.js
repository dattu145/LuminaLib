import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function test() {
    const { data: books, error: err1 } = await supabase.from('books').select('*');
    console.log("Books:", books?.length, err1);
    const { data: users, error: err2 } = await supabase.from('users').select('*');
    console.log("Users:", users?.length, err2);
}
test();
