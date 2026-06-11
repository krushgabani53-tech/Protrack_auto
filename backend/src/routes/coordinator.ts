import { Router } from 'express';
import { exportYearlyReport, getOrphanStudents, autoGroupOrphans } from '../controllers/coordinator.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticateRequest);
router.use(authorize('COORDINATOR'));

router.get('/export-report', exportYearlyReport);
router.get('/orphans', getOrphanStudents);
router.post('/auto-group', autoGroupOrphans);

export default router;
