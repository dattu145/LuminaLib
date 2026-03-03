import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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

export const listStudents = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('users')
            .select('id, name, email, register_number, department, phone, is_active, created_at', { count: 'exact' })
            .eq('role', 'student');

        if (search) {
            query = query.or(`name.ilike.%${search}%,register_number.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: students, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        res.json({
            data: students || [],
            total: count || 0,
            page: Number(page),
            per_page: Number(limit),
            last_page: Math.ceil((count || 0) / limit)
        });
    } catch (err) {
        console.error('List students error:', err);
        res.status(500).json({ message: 'Failed to fetch students' });
    }
};

export const searchStudents = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 1) return res.json([]);

        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, register_number, department')
            .eq('role', 'student')
            .eq('is_active', true)
            .or(`register_number.ilike.%${q.trim()}%,name.ilike.%${q.trim()}%`)
            .limit(10);

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Student search error:', err);
        res.status(500).json({ message: 'Failed to search students' });
    }
};

export const createStudent = async (req, res) => {
    try {
        const { name, email, register_number, phone, department } = req.body;

        if (!name || !email || !register_number) {
            return res.status(422).json({ message: 'Name, email, and register number are required' });
        }

        // Generate strong random password string internally. (No more Lumina@regno)
        const rawPassword = crypto.randomBytes(8).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const { data: newStudent, error } = await supabase
            .from('users')
            .insert([{
                id: crypto.randomUUID(),
                name,
                email,
                register_number,
                phone,
                department,
                role: 'student',
                password: hashedPassword,
                is_active: true
            }])
            .select('id, name, email, register_number, role, is_active')
            .single();

        if (error) {
            if (error.message.includes('unique constraint')) {
                return res.status(409).json({ message: 'Email or Register Number already exists' });
            }
            throw error;
        }

        res.status(201).json({ message: 'Student created successfully', student: newStudent });
    } catch (err) {
        console.error('Create student error:', err);
        res.status(500).json({ message: 'Failed to create student' });
    }
};

export const bulkCreateStudents = async (req, res) => {
    try {
        const { students } = req.body;
        if (!students || !Array.isArray(students) || students.length === 0) {
            return res.status(422).json({ message: 'Valid students array is required' });
        }

        let successCount = 0;
        let errors = [];

        // Note: Supabase bulk insert exists, but looping allows graceful skip of duplicates without failing entire batch
        for (const [index, std] of students.entries()) {
            if (!std.name || !std.email || !std.register_number) {
                errors.push({ row: index + 1, email: std.email, error: 'Missing required fields' });
                continue;
            }

            try {
                // Check if user exists first to reliably prevent false logging format in Supabase JS
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .or(`email.eq.${std.email},register_number.eq.${std.register_number}`)
                    .maybeSingle();

                if (existingUser) {
                    errors.push({ row: index + 1, email: std.email, error: 'Duplicate Record (Email or Reg No exists)' });
                    continue; // Skip silently
                }

                // Generate random hash for bulk creations too
                const rawPassword = crypto.randomBytes(8).toString('hex');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(rawPassword, salt);

                const { error } = await supabase
                    .from('users')
                    .insert([{
                        id: crypto.randomUUID(),
                        name: std.name,
                        email: std.email,
                        register_number: std.register_number,
                        phone: std.phone || null,
                        department: std.department || null,
                        role: 'student',
                        password: hashedPassword,
                        is_active: true
                    }]);

                if (error) throw error;
                successCount++;
            } catch (err) {
                errors.push({ row: index + 1, email: std.email, error: err.message.includes('unique constraint') ? 'Duplicate Record' : 'Insertion failed' });
            }
        }

        res.json({
            message: `Processed ${students.length} students.`,
            success: successCount,
            failed: errors.length,
            errors
        });

    } catch (err) {
        console.error('Bulk upload error:', err);
        res.status(500).json({ message: 'Failed to process bulk upload' });
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
