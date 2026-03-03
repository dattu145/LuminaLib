import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import { randomUUID } from 'crypto';
import axios from 'axios';

// ─── Brevo email helper ─────────────────────────────────────────────────────
const sendBrevoEmail = async ({ to, name, subject, html }) => {
    const apiKey = process.env.BRAVO_API_KEY;
    const senderEmail = process.env.BRAVO_SENDER_EMAIL || 'no-reply@luminalib.com';
    if (!apiKey) {
        console.log(`[DEV] Email skipped (no BRAVO_API_KEY) → ${to}: ${subject}`);
        return;
    }
    try {
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: 'LuminaLib', email: senderEmail },
            to: [{ email: to, name }],
            subject,
            htmlContent: html
        }, {
            headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
            timeout: 7000
        });
    } catch (err) {
        console.error(`[Brevo] Failed to send email to ${to}:`, err.response?.data || err.message);
    }
};

// ─── Build beautiful HTML reminder email ───────────────────────────────────
const buildStudentReminderEmail = (studentName, bookTitle, bookCode, dueDate) => {
    const due = new Date(dueDate + 'Z'); // treat as UTC
    const dueDateStr = due.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' });
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(30,64,175,0.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:36px 40px 28px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">⏰</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">Book Return Reminder</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">LuminaLib · Library Management System</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Hello <strong>${studentName}</strong>,</p>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
              This is a friendly reminder that the book you borrowed is due for return in <strong style="color:#d97706;">2 days</strong>. Please return it on time to avoid late fines.
            </p>
            <div style="background:#fffbeb;border:2px solid #fcd34d;border-radius:14px;padding:24px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#92400e;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding-bottom:12px;">Book Details</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#78350f;font-size:14px;">📖 <strong>Title:</strong> ${bookTitle}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#78350f;font-size:14px;">🔖 <strong>Code:</strong> ${bookCode}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#78350f;font-size:14px;">📅 <strong>Due Date:</strong> ${dueDateStr}</td>
                </tr>
              </table>
            </div>
            <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;color:#991b1b;font-size:13px;">⚠️ A fine of <strong>₹1 per day</strong> will be charged for late returns.</p>
            </div>
            <p style="margin:0;color:#94a3b8;font-size:13px;">If you have already returned the book, please ignore this message.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 LuminaLib · College Library Management System</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

const buildLibrarianReminderEmail = (librarianName, studentName, studentEmail, bookTitle, bookCode, dueDate) => {
    const due = new Date(dueDate + 'Z');
    const dueDateStr = due.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' });
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(30,64,175,0.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af 0%,#4f46e5 100%);padding:36px 40px 28px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">📋</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">Due Return Alert</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">LuminaLib · Librarian Notification</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Hello <strong>${librarianName}</strong>,</p>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
              The following student has a book due for return in <strong style="color:#1e40af;">2 days</strong>. A reminder email has also been sent to the student.
            </p>
            <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:14px;padding:24px;margin-bottom:20px;">
              <p style="margin:0 0 12px;font-size:12px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Student</p>
              <p style="margin:4px 0;color:#1e293b;font-size:14px;">👤 <strong>${studentName}</strong></p>
              <p style="margin:4px 0;color:#64748b;font-size:13px;">✉️ ${studentEmail}</p>
            </div>
            <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:14px;padding:24px;">
              <p style="margin:0 0 12px;font-size:12px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Book</p>
              <p style="margin:4px 0;color:#1e293b;font-size:14px;">📖 <strong>${bookTitle}</strong></p>
              <p style="margin:4px 0;color:#64748b;font-size:13px;">🔖 Code: ${bookCode}</p>
              <p style="margin:4px 0;color:#64748b;font-size:13px;">📅 Due: ${dueDateStr}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 LuminaLib · this is an automated notification</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

// ─── Main cron initializer ─────────────────────────────────────────────────
const initCronJobs = () => {
    console.log('Initializing Library Background Services...');

    // Runs every day at 8:00 AM IST
    cron.schedule('0 8 * * *', async () => {
        console.log('[CRON] Running daily book return reminder check...');
        try {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 2);
            const targetDateString = targetDate.toISOString().split('T')[0];

            const { data: upcomingIssues, error } = await supabase
                .from('book_issues')
                .select('id, user_id, book_id, due_date, reminder_sent, book:books(title, book_code), user:users(name, email)')
                .is('returned_date', null)
                .eq('reminder_sent', false)
                .gte('due_date', `${targetDateString}T00:00:00.000Z`)
                .lte('due_date', `${targetDateString}T23:59:59.999Z`);

            if (error) { console.error('[CRON] Fetch error:', error.message); return; }
            if (!upcomingIssues || upcomingIssues.length === 0) { console.log('[CRON] No reminders needed today.'); return; }

            // Fetch all admins and librarians to notify
            const { data: staff } = await supabase
                .from('users')
                .select('id, name, email')
                .in('role', ['admin', 'librarian']);

            const notificationsToInsert = [];
            const issueIdsToUpdate = [];

            for (const issue of upcomingIssues) {
                const { user: student, book } = issue;
                const dueDateStr = new Date(issue.due_date + 'Z').toLocaleDateString('en-IN', {
                    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata'
                });

                // ── 1. Email the student
                await sendBrevoEmail({
                    to: student.email,
                    name: student.name,
                    subject: `⏰ Reminder: "${book.title}" is due in 2 days`,
                    html: buildStudentReminderEmail(student.name, book.title, book.book_code, issue.due_date)
                });

                // In-app notification for student
                notificationsToInsert.push({
                    id: randomUUID(),
                    user_id: issue.user_id,
                    title: 'Book Return Reminder',
                    message: `"${book.title}" is due on ${dueDateStr}. Please return it to avoid fines.`,
                    type: 'warning',
                    is_system_generated: true,
                    created_at: new Date().toISOString()
                });

                // ── 2. Email all staff (admins + librarians)
                for (const member of (staff || [])) {
                    await sendBrevoEmail({
                        to: member.email,
                        name: member.name,
                        subject: `📋 Due Return Alert: ${student.name} — "${book.title}"`,
                        html: buildLibrarianReminderEmail(member.name, student.name, student.email, book.title, book.book_code, issue.due_date)
                    });

                    notificationsToInsert.push({
                        id: randomUUID(),
                        user_id: member.id,
                        title: 'Due Return Alert',
                        message: `${student.name} has "${book.title}" due in 2 days.`,
                        type: 'info',
                        is_system_generated: true,
                        created_at: new Date().toISOString()
                    });
                }

                issueIdsToUpdate.push(issue.id);
            }

            // Insert all in-app notifications
            if (notificationsToInsert.length > 0) {
                const { error: notifError } = await supabase.from('notifications').insert(notificationsToInsert);
                if (notifError) console.error('[CRON] Notification insert error:', notifError);
            }

            // Mark reminder_sent = true so we don't re-send
            if (issueIdsToUpdate.length > 0) {
                await supabase.from('book_issues').update({ reminder_sent: true }).in('id', issueIdsToUpdate);
            }

            console.log(`[CRON] ✅ Sent reminders for ${issueIdsToUpdate.length} book(s).`);
        } catch (err) {
            console.error('[CRON] Reminder job failed:', err);
        }
    }, { timezone: 'Asia/Kolkata' });
};

export default initCronJobs;
