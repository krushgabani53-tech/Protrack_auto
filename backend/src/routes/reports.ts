import { Router } from 'express';
import { authenticateRequest, authorize } from '../middleware/auth.js';
import { getMarksheet, getBatchReport, getComplianceReport } from '../controllers/reports.js';

const router = Router();
router.use(authenticateRequest);

// Per-group marksheet — any authenticated role (guide, committee, coordinator)
router.get('/marksheet/:group_id', getMarksheet);

// Batch summary — coordinator only
router.get('/batch', authorize('COORDINATOR'), getBatchReport);

// Compliance — coordinator only
router.get('/compliance', authorize('COORDINATOR'), getComplianceReport);

export default router;
