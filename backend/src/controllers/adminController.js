import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

export const listStaff = async (req, res) => {
    try {
        const { data: staff, error } = await supabase
            .from('users')
            .select('id, name, email, role, is_active')
            .in('role', ['librarian', 'admin']);

        if (error) throw error;
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch staff' });
    }
};

export const createLibrarian = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(422).json({ message: 'Missing fields' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a random register_number for staff to fulfill unique constraint if it's there
        const register_number = `STAFF-${Date.now()}`;

        const { data: newLib, error } = await supabase
            .from('users')
            .insert([{
                name,
                email,
                password: hashedPassword,
                role: 'librarian',
                register_number,
                is_active: true
            }])
            .select('id, name, email, role, is_active')
            .single();

        if (error) throw error;
        res.status(201).json(newLib);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create librarian' });
    }
};

export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const { error } = await supabase
            .from('users')
            .update({ is_active })
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'User status updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to toggle status' });
    }
};

export const getFineConfig = async (req, res) => {
    try {
        const { data: config, error } = await supabase
            .from('fines_configs')
            .select('*')
            .limit(1)
            .single();

        // If table is empty just return defaults
        if (error || !config) {
            return res.json({ daily_fine_amount: 10, max_fine_amount: 500 });
        }
        res.json(config);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch fine config' });
    }
};

export const updateFineConfig = async (req, res) => {
    try {
        const { daily_fine_amount, max_fine_amount } = req.body;

        const { data: config } = await supabase.from('fines_configs').select('id').limit(1).single();

        if (config) {
            await supabase.from('fines_configs').update({ daily_fine_amount, max_fine_amount }).eq('id', config.id);
        } else {
            await supabase.from('fines_configs').insert([{ daily_fine_amount, max_fine_amount }]);
        }

        res.json({ message: 'Fine configuration updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update config' });
    }
};

export const exportUsers = async (req, res) => {
    try {
        // Just return all users without passwords for export
        const { data: users, error } = await supabase
            .from('users')
            .select('name, email, register_number, role, phone, is_active, created_at');

        if (error) throw error;
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Failed to export' });
    }
};
