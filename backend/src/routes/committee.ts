import { Router } from 'express';
import { searchHistoricProjects } from '../controllers/committee.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticateRequest);
router.get('/historic-projects', authorize('COMMITTEE'), searchHistoricProjects);

export default router;
