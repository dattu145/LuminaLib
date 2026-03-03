import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import axios from 'axios';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Safely parse a Supabase timestamp (which may be WITHOUT TIMEZONE) as UTC
const parseSupabaseTimestamp = (ts) => {
    if (!ts) return null;
    // If it already has timezone info, use as-is; otherwise treat as UTC
    const str = String(ts);
    if (str.endsWith('Z') || str.includes('+')) return new Date(str);
    return new Date(str + 'Z'); // force UTC interpretation
};

export const requestPasswordUpdate = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const { data: user, error: fetchError } = await supabase
            .from('users').select('id, name, email').eq('email', email.trim().toLowerCase()).single();

        if (fetchError || !user) return res.status(404).json({ message: 'User not found' });

        const otp = generateOTP();
        // Store expiry as UTC ISO string — 10 minutes from now
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const { error: updateError } = await supabase
            .from('users')
            .update({ reset_otp: otp, reset_otp_expires_at: expiresAt })
            .eq('id', user.id);

        if (updateError) {
            console.error('OTP update error:', updateError);
            if (updateError.message?.includes('column') || updateError.code === '42703') {
                return res.status(500).json({ message: 'DB columns missing. Run the SQL migration in Supabase first.' });
            }
            throw updateError;
        }

        const bravoKey = process.env.BRAVO_API_KEY;
        const senderEmail = process.env.BRAVO_SENDER_EMAIL || 'no-reply@luminalib.com';
        const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

        // Format expiry time for display in email (human-readable)
        const expiryDisplay = new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
        });

        if (bravoKey) {
            try {
                await axios.post(BREVO_URL, {
                    sender: { name: 'LuminaLib', email: senderEmail },
                    to: [{ email: user.email, name: user.name }],
                    subject: 'Your LuminaLib Password Reset Code',
                    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(30,64,175,0.10);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af 0%,#4f46e5 100%);padding:40px 40px 32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:16px;margin-bottom:16px;">
              <span style="font-size:28px;">📚</span>
            </div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">LuminaLib</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;font-weight:500;">Library Management System</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;color:#64748b;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Password Reset</p>
            <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px;font-weight:800;">Hello, ${user.name} 👋</h2>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
              We received a request to reset your LuminaLib password. Use the one-time code below to verify your identity and set a new password.
            </p>
            <!-- OTP Box -->
            <div style="background:linear-gradient(135deg,#eff6ff 0%,#eef2ff 100%);border:2px solid #c7d2fe;border-radius:16px;padding:32px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 12px;color:#6366f1;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Your One-Time Password</p>
              <div style="font-size:48px;font-weight:900;letter-spacing:18px;color:#1e40af;font-family:'Courier New',monospace;padding-left:18px;">${otp}</div>
              <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">Valid for <strong style="color:#1e40af;">10 minutes</strong> · Expires at <strong style="color:#1e40af;">${expiryDisplay} IST</strong></p>
            </div>
            <!-- Warning -->
            <div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;color:#92400e;font-size:13px;">
                ⚠️ <strong>Never share this code</strong> with anyone. LuminaLib staff will never ask for your OTP.
              </p>
            </div>
            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
              If you didn't request a password reset, you can safely ignore this email — your account remains secure.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 LuminaLib · College Library Management System</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
                }, {
                    headers: { 'accept': 'application/json', 'api-key': bravoKey, 'content-type': 'application/json' },
                    timeout: 7000
                });
            } catch (emailError) {
                console.error('Brevo Email Error:', emailError.response?.data || emailError.message);
                return res.status(500).json({ message: 'Failed to send OTP email. Check your BRAVO_API_KEY in .env.' });
            }
        } else {
            console.log(`\n[DEV] OTP for ${email}: ${otp}\n`);
        }

        res.json({ message: 'OTP sent successfully to your email' });
    } catch (error) {
        console.error('Request password update error:', error);
        res.status(500).json({ message: 'Failed to process request' });
    }
};

// Step 2: Verify OTP only (no password change yet)
export const verifyOtpOnly = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, reset_otp, reset_otp_expires_at')
            .eq('email', email.trim().toLowerCase())
            .single();

        if (fetchError || !user) return res.status(404).json({ message: 'User not found' });

        const storedOtp = String(user.reset_otp || '').trim();
        const enteredOtp = String(otp || '').trim();

        console.log(`[OTP CHECK] stored="${storedOtp}" entered="${enteredOtp}" match=${storedOtp === enteredOtp}`);

        if (!storedOtp || storedOtp !== enteredOtp) {
            return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
        }

        // ⚠️ FIX: Supabase TIMESTAMP WITHOUT TIME ZONE — must treat as UTC
        const expiresAt = parseSupabaseTimestamp(user.reset_otp_expires_at);
        console.log(`[OTP EXPIRY] stored="${user.reset_otp_expires_at}" parsed=${expiresAt?.toISOString()} now=${new Date().toISOString()}`);

        if (!expiresAt || expiresAt < new Date()) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        res.json({ verified: true, message: 'OTP verified. You can now set your new password.' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
};

// Step 3: Set new password (called after OTP verified on frontend)
export const verifyAndUpdatePassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }

        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, reset_otp, reset_otp_expires_at')
            .eq('email', email.trim().toLowerCase())
            .single();

        if (fetchError || !user) return res.status(404).json({ message: 'User not found' });

        const storedOtp = String(user.reset_otp || '').trim();
        const enteredOtp = String(otp || '').trim();

        if (!storedOtp || storedOtp !== enteredOtp) {
            return res.status(400).json({ message: 'Invalid OTP. Please restart the process.' });
        }

        // ⚠️ FIX: same timezone fix for the final password update step
        const expiresAt = parseSupabaseTimestamp(user.reset_otp_expires_at);
        if (!expiresAt || expiresAt < new Date()) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword, reset_otp: null, reset_otp_expires_at: null })
            .eq('id', user.id);

        if (updateError) throw updateError;

        res.json({ message: 'Password updated successfully! Please log in with your new password.' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ message: 'Failed to update password' });
    }
};
