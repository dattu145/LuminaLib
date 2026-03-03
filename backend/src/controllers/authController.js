import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID, randomBytes } from 'crypto';
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

        const identifier = email.trim();

        // Fetch user by email OR register_number — whichever they type
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${identifier},register_number.eq.${identifier}`)
            .maybeSingle();

        if (error || !user) {
            return res.status(422).json({ errors: { email: ['The provided credentials are incorrect.'] } });
        }

        // Verify password hash
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
        const register_number_clean = register_number.trim();
        if (!register_number_clean) return res.status(400).json({ message: 'Register number is required.' });
        console.log('[DEBUG] requestAccountDetails called with reg:', JSON.stringify(register_number_clean));

        // Lookup Student — maybeSingle returns null (not error) when no rows found
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, register_number, role')
            .eq('register_number', register_number_clean)
            .maybeSingle();

        console.log('[DEBUG] Supabase result - data:', JSON.stringify(user), 'error:', JSON.stringify(error));

        if (error) {
            console.error('Supabase lookup error:', error.message, error.code);
            return res.status(500).json({ message: 'Database error: ' + error.message });
        }

        if (!user) {
            return res.status(404).json({ message: 'No account found for this register number.' });
        }

        if (user.role !== 'student') {
            return res.status(404).json({ message: 'No student account found for this register number.' });
        }

        // Generate brand new temporary random password hash
        const rawPassword = randomBytes(6).toString('hex'); // e.g. "a1b2c3d4e5f6"
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
                    subject: '📚 Your LuminaLib Account Credentials',
                    htmlContent: `<!DOCTYPE html>
<html lang="en">
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#0f172a;padding:40px 0;">
  <table width="540" align="center" style="background:#1e293b;border-radius:20px;padding:40px;text-align:center;border:1px solid #334155;">
    <tr><td style="padding-bottom:20px;">
      <h1 style="color:#60a5fa;font-size:28px;font-weight:900;margin:0;">LuminaLib<span style="color:#818cf8;">.</span></h1>
    </td></tr>
    <tr><td><h2 style="color:#f1f5f9;font-weight:700;font-size:22px;">Hello ${user.name},</h2></td></tr>
    <tr><td><p style="color:#94a3b8;line-height:1.7;font-size:15px;">Your LuminaLib library account is ready. Here are your login credentials.</p></td></tr>
    <tr><td style="padding:20px 0;">
      <div style="background:#0f172a;padding:28px;border:2px solid #3b82f6;border-radius:16px;margin:10px 0;">
        <p style="margin:0 0 12px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Your Credentials</p>
        <p style="margin:8px 0;color:#e2e8f0;font-size:15px;"><strong style="color:#94a3b8;">Register No:</strong>&nbsp; <span style="font-family:monospace;color:#60a5fa;font-weight:700;">${user.register_number}</span></p>
        <p style="margin:8px 0;color:#e2e8f0;font-size:15px;"><strong style="color:#94a3b8;">Password:</strong>&nbsp; <code style="background:#1e293b;border:1px solid #3b82f6;padding:6px 14px;border-radius:8px;font-size:18px;font-weight:900;color:#a5f3fc;letter-spacing:2px;">${rawPassword}</code></p>
      </div>
    </td></tr>
    <tr><td><p style="color:#64748b;font-size:13px;line-height:1.6;">Log in at your library portal using the credentials above.<br>You can change your password anytime from your profile settings.</p></td></tr>
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
