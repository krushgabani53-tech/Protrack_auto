import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Standard milestone keys for SPPU project lifecycle
export const STANDARD_MILESTONES = [
    { key: 'GROUP_FORMATION', name: 'Group Formation' },
    { key: 'TOPIC_SUBMISSION', name: 'Topic Submission' },
    { key: 'SYNOPSIS_SUBMISSION', name: 'Synopsis Submission' },
    { key: 'REVIEW_1', name: 'Review 1 Presentation' },
    { key: 'REVIEW_2', name: 'Review 2 Presentation' },
    { key: 'REVIEW_3', name: 'Review 3 Presentation' },
    { key: 'FINAL_REPORT', name: 'Final Report Submission' },
    { key: 'FINAL_VIVA', name: 'Final Viva Examination' },
];

// Get milestones for a specific batch year
export async function getMilestonesForBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { batch_year } = req.params;

        if (!batch_year || isNaN(parseInt(batch_year))) {
            res.status(400).json({ error: 'Valid batch_year is required' });
            return;
        }

        const milestones = await query(
            `SELECT 
                milestone_id,
                batch_year,
                milestone_key,
                milestone_name,
                due_date,
                is_completed,
                created_by,
                created_at
             FROM batch_milestones
             WHERE batch_year = $1
             ORDER BY due_date ASC`,
            [parseInt(batch_year)]
        );

        res.status(200).json({
            batch_year: parseInt(batch_year),
            milestones,
            total: milestones.length
        });
    } catch (error) {
        console.error('Get milestones error:', error);
        res.status(500).json({ error: 'Failed to fetch milestones' });
    }
}

// Create or update a milestone
export async function createOrUpdateMilestone(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { batch_year, milestone_key, milestone_name, due_date } = req.body;
        const user_id = req.user?.user_id;

        // Validation
        if (!batch_year || !milestone_key || !milestone_name || !due_date) {
            res.status(400).json({ 
                error: 'batch_year, milestone_key, milestone_name, and due_date are required' 
            });
            return;
        }

        if (isNaN(parseInt(batch_year))) {
            res.status(400).json({ error: 'batch_year must be a valid integer' });
            return;
        }

        // Validate milestone_key is one of the standard ones
        const validKeys = STANDARD_MILESTONES.map(m => m.key);
        if (!validKeys.includes(milestone_key)) {
            res.status(400).json({ 
                error: `milestone_key must be one of: ${validKeys.join(', ')}` 
            });
            return;
        }

        // Validate due_date is a valid timestamp
        const dueDate = new Date(due_date);
        if (isNaN(dueDate.getTime())) {
            res.status(400).json({ error: 'due_date must be a valid ISO timestamp' });
            return;
        }

        // Check if milestone already exists (upsert logic)
        const existing = await query(
            'SELECT milestone_id FROM batch_milestones WHERE batch_year = $1 AND milestone_key = $2',
            [parseInt(batch_year), milestone_key]
        );

        let result;
        if (existing.length > 0) {
            // Update existing milestone
            result = await query(
                `UPDATE batch_milestones 
                 SET milestone_name = $1, due_date = $2
                 WHERE batch_year = $3 AND milestone_key = $4
                 RETURNING milestone_id, batch_year, milestone_key, milestone_name, due_date, is_completed, created_at`,
                [milestone_name, dueDate.toISOString(), parseInt(batch_year), milestone_key]
            );
        } else {
            // Create new milestone
            result = await query(
                `INSERT INTO batch_milestones (batch_year, milestone_key, milestone_name, due_date, created_by, is_completed)
                 VALUES ($1, $2, $3, $4, $5, false)
                 RETURNING milestone_id, batch_year, milestone_key, milestone_name, due_date, is_completed, created_at`,
                [parseInt(batch_year), milestone_key, milestone_name, dueDate.toISOString(), user_id]
            );
        }

        const milestone = result[0];

        res.status(existing.length > 0 ? 200 : 201).json({
            message: existing.length > 0 ? 'Milestone updated successfully' : 'Milestone created successfully',
            milestone
        });
    } catch (error) {
        console.error('Create/Update milestone error:', error);
        res.status(500).json({ error: 'Failed to create/update milestone' });
    }
}

// Mark a milestone as complete
export async function markMilestoneComplete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { milestone_id } = req.params;
        const { is_completed = true } = req.body;

        if (typeof is_completed !== 'boolean') {
            res.status(400).json({ error: 'is_completed must be a boolean' });
            return;
        }

        const result = await query(
            `UPDATE batch_milestones 
             SET is_completed = $1
             WHERE milestone_id = $2
             RETURNING milestone_id, batch_year, milestone_key, milestone_name, due_date, is_completed`,
            [is_completed, milestone_id]
        );

        if (result.length === 0) {
            res.status(404).json({ error: 'Milestone not found' });
            return;
        }

        res.status(200).json({
            message: `Milestone marked as ${is_completed ? 'completed' : 'incomplete'}`,
            milestone: result[0]
        });
    } catch (error) {
        console.error('Mark milestone complete error:', error);
        res.status(500).json({ error: 'Failed to update milestone status' });
    }
}

// Delete a milestone
export async function deleteMilestone(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { milestone_id } = req.params;

        const result = await query(
            'DELETE FROM batch_milestones WHERE milestone_id = $1 RETURNING milestone_id, milestone_name',
            [milestone_id]
        );

        if (result.length === 0) {
            res.status(404).json({ error: 'Milestone not found' });
            return;
        }

        res.status(200).json({
            message: 'Milestone deleted successfully',
            milestone_id: result[0].milestone_id,
            milestone_name: result[0].milestone_name
        });
    } catch (error) {
        console.error('Delete milestone error:', error);
        res.status(500).json({ error: 'Failed to delete milestone' });
    }
}

// Get all batch years with milestones
export async function getAllBatchYears(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const result = await query(
            `SELECT DISTINCT batch_year 
             FROM batch_milestones 
             ORDER BY batch_year DESC`
        );

        const batchYears = result.map(row => row.batch_year);

        res.status(200).json({
            batch_years: batchYears,
            total: batchYears.length
        });
    } catch (error) {
        console.error('Get batch years error:', error);
        res.status(500).json({ error: 'Failed to fetch batch years' });
    }
}

// Get upcoming milestone for a batch
export async function getUpcomingMilestone(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { batch_year } = req.params;

        if (!batch_year || isNaN(parseInt(batch_year))) {
            res.status(400).json({ error: 'Valid batch_year is required' });
            return;
        }

        const result = await query(
            `SELECT 
                milestone_id,
                batch_year,
                milestone_key,
                milestone_name,
                due_date,
                is_completed
             FROM batch_milestones
             WHERE batch_year = $1 
               AND is_completed = false 
               AND due_date >= CURRENT_TIMESTAMP
             ORDER BY due_date ASC
             LIMIT 1`,
            [parseInt(batch_year)]
        );

        if (result.length === 0) {
            res.status(200).json({
                batch_year: parseInt(batch_year),
                milestone: null,
                message: 'No upcoming milestones found'
            });
            return;
        }

        const milestone = result[0];
        const dueDate = new Date(milestone.due_date);
        const now = new Date();
        const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        res.status(200).json({
            batch_year: parseInt(batch_year),
            milestone: {
                ...milestone,
                days_remaining: daysRemaining
            }
        });
    } catch (error) {
        console.error('Get upcoming milestone error:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming milestone' });
    }
}
