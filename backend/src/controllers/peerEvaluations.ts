import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function submitEvaluation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id, evaluatee_id, score, comments } = req.body;
        const evaluator_id = req.user?.user_id;

        if (!evaluator_id || !evaluatee_id || score < 1 || score > 5) {
            res.status(400).json({ error: 'Invalid evaluation data' });
            return;
        }

        const result = await query(
            `INSERT INTO peer_evaluations (group_id, evaluator_id, evaluatee_id, score, comments)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (evaluator_id, evaluatee_id)
             DO UPDATE SET score = EXCLUDED.score, comments = EXCLUDED.comments, created_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [group_id, evaluator_id, evaluatee_id, score, comments]
        );

        res.status(201).json(result[0]);
    } catch (error) {
        console.error('Submit peer evaluation error:', error);
        res.status(500).json({ error: 'Failed to submit peer evaluation' });
    }
}

export async function getGroupEvaluations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id } = req.params;
        
        // Return evaluations for this group, including full names
        const evaluations = await query(
            `SELECT p.*, u_tor.full_name as evaluator_name, u_tee.full_name as evaluatee_name
             FROM peer_evaluations p
             JOIN users u_tor ON p.evaluator_id = u_tor.user_id
             JOIN users u_tee ON p.evaluatee_id = u_tee.user_id
             WHERE p.group_id = $1`,
            [group_id]
        );
        
        res.status(200).json(evaluations);
    } catch (error) {
        console.error('Get peer evaluations error:', error);
        res.status(500).json({ error: 'Failed to fetch peer evaluations' });
    }
}
