import cron from 'node-cron';
import { pool } from '../config/database.js';
import { sendLogbookReminderEmail } from '../utils/emailService.js';

/**
 * Checks all active project groups to see if they have submitted a logbook in the last 7 days.
 * If not, it inserts an urgent system alert into their chat.
 */
export const checkOverdueReminders = async () => {
    console.log('[Cron] Starting overdue reminders check...');
    try {
        // 1. Get all active groups with their guide email
        const activeGroupsResult = await pool.query(
            `SELECT g.group_id, g.group_name, u.email as guide_email
             FROM project_groups g
             LEFT JOIN users u ON g.guide_id = u.user_id
             WHERE g.status = 'ACTIVE'`
        );
        const activeGroups = activeGroupsResult.rows;

        if (activeGroups.length === 0) {
            console.log('[Cron] No active groups found. Skipping.');
            return { processed: 0, alerted: 0 };
        }

        // 2. Get the system/coordinator user id to send the message as, or just use a NULL/special ID.
        // For simplicity, we will query for a user with the role 'COORDINATOR' to act as the sender.
        const coordinatorResult = await pool.query(
            "SELECT user_id FROM users WHERE role = 'COORDINATOR' LIMIT 1"
        );

        if (coordinatorResult.rows.length === 0) {
            console.error('[Cron] No coordinator found to send alerts from.');
            return { processed: 0, alerted: 0 };
        }

        const senderId = coordinatorResult.rows[0].user_id;
        let alertedCount = 0;

        // 3. For each group, check if they have a logbook submitted in the last 7 days.
        for (const group of activeGroups) {
            const { group_id, group_name, guide_email } = group;

            const recentLogbookResult = await pool.query(
                `SELECT log_id FROM logbooks 
                 WHERE group_id = $1 AND created_at >= NOW() - INTERVAL '7 days' 
                 LIMIT 1`,
                [group_id]
            );

            // If no recent logbook, send the alert
            if (recentLogbookResult.rows.length === 0) {
                await pool.query(
                    `INSERT INTO chat_messages (group_id, sender_id, content, is_announcement) 
                     VALUES ($1, $2, $3, $4)`,
                    [
                        group_id,
                        senderId,
                        "⚠️ System Alert: Your group has an overdue weekly logbook. Please submit it immediately to avoid penalties.",
                        true // treating as announcement so it highlights
                    ]
                );

                if (guide_email) {
                    await sendLogbookReminderEmail(group_name, guide_email, "Current");
                }

                alertedCount++;
            }
        }

        console.log(`[Cron] Reminders check complete. Processed ${activeGroups.length} groups, alerted ${alertedCount}.`);
        return { processed: activeGroups.length, alerted: alertedCount };
    } catch (error) {
        console.error('[Cron] Error checking overdue reminders:', error);
        throw error;
    }
};

// Initialize the cron job
export const initCronJobs = () => {
    // Run every Friday at 17:00 (5:00 PM)
    // format: min hour day-of-month month day-of-week
    cron.schedule('0 17 * * 5', async () => {
        console.log('[Cron] Triggering scheduled Friday 5PM overdue reminder check...');
        await checkOverdueReminders();
    });

    console.log('[Cron] Scheduled jobs initialized (Overdue reminders: Friday 17:00).');
};
