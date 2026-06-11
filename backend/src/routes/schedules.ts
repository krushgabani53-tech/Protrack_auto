import { Router } from 'express';
import * as scheduleController from '../controllers/schedules.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticateRequest);

router.post('/', authorize('COORDINATOR'), scheduleController.createOrUpdateSchedule);
router.get('/', scheduleController.getSchedules);
router.get('/smart-slots', authorize('COORDINATOR', 'COMMITTEE'), scheduleController.getSmartSlots);

export default router;
