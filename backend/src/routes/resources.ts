import { Router } from 'express';
import { getResources, createResource } from '../controllers/resources.js';
import { authenticateRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticateRequest);
router.get('/:group_id', getResources);
router.post('/', createResource);

export default router;
