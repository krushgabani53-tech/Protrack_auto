import { Router } from 'express';
import { authenticateRequest } from '../middleware/auth.js';
import { submitEvaluation, getGroupEvaluations } from '../controllers/peerEvaluations.js';

const router = Router();

router.use(authenticateRequest);

router.post('/', submitEvaluation);
router.get('/group/:group_id', getGroupEvaluations);

export default router;
