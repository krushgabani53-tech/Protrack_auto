import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateRequest, getSettings);
router.post('/', authenticateRequest, authorize('COORDINATOR'), updateSettings);

export default router;
