import { Router } from 'express';
import { authenticateRequest, authorize } from '../middleware/auth.js';
import { getMappings, saveMapping, resetMappings } from '../controllers/poMapping.js';

const router = Router();

router.use(authenticateRequest);

router.get('/', getMappings);
router.post('/', authorize('COORDINATOR'), saveMapping);
router.delete('/', authorize('COORDINATOR'), resetMappings);

export default router;
