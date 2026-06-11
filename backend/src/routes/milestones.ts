import { Router } from 'express';
import * as milestonesController from '../controllers/milestones.js';
import { authenticateRequest, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateRequest);

// Get milestones for a specific batch year (accessible to all authenticated users)
router.get('/:batch_year', milestonesController.getMilestonesForBatch);

// Get upcoming milestone for a batch (accessible to all authenticated users)
router.get('/:batch_year/upcoming', milestonesController.getUpcomingMilestone);

// Get all batch years with milestones (accessible to all authenticated users)
router.get('/batch-years/list', milestonesController.getAllBatchYears);

// Create or update a milestone (Coordinator only)
router.post('/', authorize('COORDINATOR'), milestonesController.createOrUpdateMilestone);

// Mark milestone as complete/incomplete (Coordinator only)
router.patch('/:milestone_id/complete', authorize('COORDINATOR'), milestonesController.markMilestoneComplete);

// Delete a milestone (Coordinator only)
router.delete('/:milestone_id', authorize('COORDINATOR'), milestonesController.deleteMilestone);

export default router;
