import { supabase } from './src/config/supabase.js';
import bcrypt from 'bcryptjs';

async function test() {
    const register_number = "621522243055";
    const hashedPassword = await bcrypt.hash(`Lumina@${register_number}`, 10);
    const { data, error } = await supabase.from('users').insert([{
        name: "Test Student",
        email: "test55@example.com",
        register_number,
        phone: "1231231234",
        department: "CS",
        role: "student",
        password: hashedPassword,
        is_active: true
    }]);
    console.log(error || "Success");
}
test();
