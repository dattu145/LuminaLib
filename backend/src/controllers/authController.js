import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role || 'student',
            name: user.name || '',
            register_number: user.register_number || ''
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(422).json({ message: 'The email field and password are required.' });
        }

        // Fetch User
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(422).json({ errors: { email: ['The provided credentials are incorrect.'] } });
        }

        // Verify password hash (Laravel creates it using bcrypt)
        // Laravel's bcrypt hashes start with $2y$. Standard bcrypt typically uses $2a$ or $2b$. 
        // bcryptjs handles $2y$ transparently.
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(422).json({ errors: { email: ['The provided credentials are incorrect.'] } });
        }

        // Only block if is_active is explicitly false (null/undefined = allow, RLS may strip field)
        if (user.is_active === false) {
            return res.status(403).json({ message: 'Your account is deactivated. Please contact the librarian.' });
        }

        const token = generateToken(user);

        // Exclude password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            access_token: token,
            token_type: 'Bearer',
            user: userWithoutPassword
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

export const register = async (req, res) => {
    try {
        const { name, email, register_number, password, password_confirmation, phone } = req.body;

        if (!name || !email || !register_number || !password || password !== password_confirmation) {
            return res.status(422).json({
                message: 'Validation failed.',
                errors: { general: ['Please ensure all fields are correct and passwords match.'] }
            });
        }

        // Check if email or register exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`email.eq.${email},register_number.eq.${register_number}`)
            .limit(1);

        if (existingUser && existingUser.length > 0) {
            return res.status(422).json({ errors: { email: ['The email or registration number has already been taken.'] } });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate UUID server-side (Supabase anon key may not generate defaults via RLS)
        const newUserId = randomUUID();

        // Determine role based on email domain
        let assignedRole = 'student';

        // If testing mode is active and email contains 'admin', or if it's the actual college domain
        if (email.toLowerCase().endsWith('@mahendracollege.com') ||
            (process.env.REQUIRE_COLLEGE_EMAIL_FOR_ADMIN !== 'true' && email.toLowerCase().includes('admin'))) {
            assignedRole = 'admin';
        }

        const insertPayload = {
            id: newUserId,
            name,
            email,
            register_number,
            password: hashedPassword,
            role: assignedRole,
            phone: phone || null,
            is_active: true
        };

        const { data: newUser, error } = await supabase
            .from('users')
            .insert([insertPayload])
            .select()
            .single();

        if (error) throw error;

        // Supabase RLS may strip the returned row — fall back to the insert payload
        const createdUser = newUser || insertPayload;

        const token = generateToken(createdUser);
        const { password: _, ...userWithoutPassword } = createdUser;

        res.status(201).json({
            access_token: token,
            token_type: 'Bearer',
            user: userWithoutPassword
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

export const logout = async (req, res) => {
    // For JWT we don't need to do anything server side unless keeping a blacklist. 
    // Simply inform the client to delete the token.
    res.json({ message: 'Successfully logged out' });
};

export const me = (req, res) => {
    // req.user logic comes from middleware, just return it (no password)
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
};

export const updatePassword = async (req, res) => {
    try {
        const { current_password, password, password_confirmation } = req.body;
        const user = req.user; // from middleware

        if (!current_password || !password || password !== password_confirmation) {
            return res.status(422).json({ message: 'Invalid payload.' });
        }

        // Validate current password
        const isMatch = await bcrypt.compare(current_password, user.password);
        if (!isMatch) {
            return res.status(422).json({ errors: { current_password: ['The current password is incorrect.'] } });
        }

        const salt = await bcrypt.genSalt(12);
        const newHashedPassword = await bcrypt.hash(password, salt);

        const { error } = await supabase
            .from('users')
            .update({ password: newHashedPassword })
            .eq('id', user.id);

        if (error) throw error;

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Password update error:', err);
        res.status(500).json({ message: 'Server error updating password.' });
    }
};
