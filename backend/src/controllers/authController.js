import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import axios from 'axios';

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
            return res.status(409).json({
                message: 'Account already exists. Your librarian may have already pre-registered your account.',
                requiresDetails: true,
                errors: { email: ['The email or registration number has already been taken.'] }
            });
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

export const requestAccountDetails = async (req, res) => {
    try {
        const { register_number } = req.body;
        if (!register_number) return res.status(400).json({ message: 'Register number is required.' });

        // Lookup Student
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, register_number')
            .eq('register_number', register_number)
            .single();

        if (error || !user) {
            return res.status(404).json({ message: 'No pre-existing account found for this register number.' });
        }

        // Generate brand new temporary random password hash
        const rawPassword = crypto.randomBytes(6).toString('hex'); // e.g. "a1b2c3d4e5f6"
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        // Update database with new password
        await supabase.from('users').update({ password: hashedPassword }).eq('id', user.id);

        const bravoKey = process.env.BRAVO_API_KEY;
        const senderEmail = process.env.BRAVO_SENDER_EMAIL || 'no-reply@luminalib.com';

        if (bravoKey) {
            try {
                await axios.post('https://api.brevo.com/v3/smtp/email', {
                    sender: { name: 'LuminaLib', email: senderEmail },
                    to: [{ email: user.email, name: user.name }],
                    subject: '📚 Your LuminaLib Temporary Password',
                    htmlContent: `<!DOCTYPE html>
<html lang="en">
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f0f4ff;padding:40px 0;">
  <table width="520" align="center" style="background:#fff;border-radius:20px;padding:36px;text-align:center;">
    <tr><td><h2 style="color:#1e40af;">Hello ${user.name},</h2></td></tr>
    <tr><td><p style="color:#475569;line-height:1.6;">A request for your LuminaLib credentials was made. Here is your new access password.</p></td></tr>
    <tr><td>
      <div style="background:#eff6ff;padding:24px;border:2px solid #bfdbfe;border-radius:12px;margin:20px 0;">
        <p style="margin:4px 0;"><strong>Email or Reg no:</strong> ${user.register_number}</p>
        <p style="margin:8px 0;"><strong>Temporary Password:</strong> <code style="background:#e0e7ff;padding:2px 6px; font-weight: bold; font-size: 18px;">${rawPassword}</code></p>
      </div>
    </td></tr>
    <tr><td><p style="color:#94a3b8;font-size:13px;">Please log in using the password above and immediately change it via your profile settings.</p></td></tr>
  </table>
</body>
</html>`
                }, { headers: { 'api-key': bravoKey, 'content-type': 'application/json' } });
            } catch (emailError) {
                console.error('Failed to email account details:', emailError.message);
            }
        } else {
            console.log(`[DEV] Account details for ${user.register_number} mapped to email ${user.email} with NEW password ${rawPassword}`);
        }

        res.json({ message: 'Your login details have been generated and sent to your registered email address.' });
    } catch (err) {
        console.error('Request account details error:', err);
        res.status(500).json({ message: 'Failed to process request.' });
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
