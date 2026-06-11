import { Router } from 'express';
import { saveRubricTemplate, getRubricTemplates } from '../controllers/rubrics.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticateRequest);
router.post('/', authorize('COORDINATOR'), saveRubricTemplate);
router.get('/', authorize('COORDINATOR', 'COMMITTEE'), getRubricTemplates);

export default router;
