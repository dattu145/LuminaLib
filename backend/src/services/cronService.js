import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import { randomUUID } from 'crypto';

// Setting up the cron job to run every day at 8:00 AM
// Format: minute hour dayOfMonth month dayOfWeek
const initCronJobs = () => {
    console.log('Initializing Library Background Services...');

    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily book issue reminder check...');

        try {
            // Target: 2 days before the due date
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 2);
            const targetDateString = targetDate.toISOString().split('T')[0];

            // 1. Fetching issues where return date is null and due date is exactly 2 days from now.
            // Note: We use raw filtering for the date part. 
            const { data: upcomingIssues, error } = await supabase
                .from('book_issues')
                .select('id, user_id, book_id, due_date, reminder_sent, book:books(title, book_code), user:users(name, email)')
                .is('returned_at', null)
                .eq('reminder_sent', false)
                .gte('due_date', `${targetDateString}T00:00:00.000Z`)
                .lte('due_date', `${targetDateString}T23:59:59.999Z`);

            if (error) {
                console.error('Failed to fetch upcoming issues for reminders:', error.message);
                return;
            }

            if (!upcomingIssues || upcomingIssues.length === 0) {
                console.log('No reminders needed today.');
                return;
            }

            // 2. Process each issue
            const notificationsToInsert = [];
            const issueIdsToUpdate = [];

            for (const issue of upcomingIssues) {
                const studentMessage = `Reminder: The book "${issue.book.title}" is due in 2 days. Please return it by ${new Date(issue.due_date).toLocaleDateString()} to avoid late fines.`;

                // Add notification for the user
                notificationsToInsert.push({
                    id: randomUUID(),
                    user_id: issue.user_id,
                    title: 'Upcoming Book Return',
                    message: studentMessage,
                    type: 'warning',
                    is_system_generated: true,
                    created_at: new Date().toISOString()
                });

                // Add notification for admins (finding admins)
                const { data: admins } = await supabase.from('users').select('id, email').eq('role', 'admin');
                if (admins) {
                    admins.forEach(admin => {
                        notificationsToInsert.push({
                            id: randomUUID(),
                            user_id: admin.id,
                            title: 'Automated System Alert',
                            message: `Student ${issue.user.name} has a book (${issue.book.title}) due in 2 days.`,
                            type: 'info',
                            is_system_generated: true,
                            created_at: new Date().toISOString()
                        });

                        // NOTE: Brevo API for Admin goes here
                        // sendEmail(admin.email, 'Upcoming Return', `Student ${issue.user.name...}`);
                    });
                }

                // NOTE: Brevo API for Student goes here
                /* 
                  await sendBrevoEmail({
                      to: issue.user.email,
                      subject: 'Library Reminder: Book Due Soon',
                      html: `<p>Dear ${issue.user.name},</p><p>${studentMessage}</p>`
                  });
                */

                issueIdsToUpdate.push(issue.id);
            }

            // 3. Insert all notifications
            if (notificationsToInsert.length > 0) {
                const { error: notifError } = await supabase.from('notifications').insert(notificationsToInsert);
                if (notifError) console.error('Failed to insert reminder notifications:', notifError);
            }

            // 4. Update the reminder_sent flag to true
            if (issueIdsToUpdate.length > 0) {
                const { error: updateError } = await supabase
                    .from('book_issues')
                    .update({ reminder_sent: true })
                    .in('id', issueIdsToUpdate);

                if (updateError) console.error('Failed to update reminder_sent flags:', updateError);
            }

            console.log(`Successfully processed ${issueIdsToUpdate.length} reminders.`);

        } catch (err) {
            console.error('Error in daily reminder cron job:', err);
        }
    });
};

export default initCronJobs;
