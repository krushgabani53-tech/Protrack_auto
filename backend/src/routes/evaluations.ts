import { Router } from 'express';
import * as evaluationController from '../controllers/evaluations.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateRequest);

// Submit an evaluation (Committee only)
router.post('/', authorize('COMMITTEE'), evaluationController.submitEvaluation);

// Get evaluations
router.get('/', evaluationController.getEvaluations);

// Lock an evaluation (Coordinator only)
router.post('/:eval_id/lock', authorize('COORDINATOR'), evaluationController.lockEvaluation);

// Unlock an evaluation (Coordinator only)
router.delete('/:eval_id/lock', authorize('COORDINATOR'), evaluationController.unlockEvaluation);

// Lock all evaluations for a phase (Coordinator only)
router.post('/phase/:phase/lock-all', authorize('COORDINATOR'), evaluationController.lockAllEvaluationsForPhase);

export default router;
