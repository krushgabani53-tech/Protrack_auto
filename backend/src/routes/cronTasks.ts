import { Router } from 'express';
import { authenticateRequest, authorize } from '../middleware/auth.js';
import { checkOverdueReminders } from '../cron/reminders.js';

export const cronTasksRouter = Router();

// Allow Coordinators to manually trigger the cron job for testing/on-demand purposes
cronTasksRouter.post(
    '/trigger-reminders',
    authenticateRequest,
    authorize('COORDINATOR'),
    async (req, res, next) => {
        try {
            const result = await checkOverdueReminders();
            res.json({
                message: 'Overdue reminders check triggered successfully.',
                details: result
            });
        } catch (error) {
            next(error);
        }
    }
);
