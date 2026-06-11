import { Router } from 'express';
import { getGuideAnalytics, getLogbookCompliance, exportLogbookCompliance } from '../controllers/analytics.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticateRequest);

// Guide analytics
router.get('/guide', authorize('GUIDE'), getGuideAnalytics);

// Logbook compliance (Coordinator only)
router.get('/compliance', authorize('COORDINATOR'), getLogbookCompliance);
router.get('/compliance/export', authorize('COORDINATOR'), exportLogbookCompliance);

export default router;
