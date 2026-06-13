import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Submit a project proposal
export async function submitProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id } = req.params;
        const { title, domain_tags, priority = 1 } = req.body;

        if (!title) {
            res.status(400).json({ error: 'title is required' });
            return;
        }

        // Validate priority
        if (![1, 2, 3].includes(priority)) {
            res.status(400).json({ error: 'priority must be 1, 2, or 3' });
            return;
        }

        const tags = Array.isArray(domain_tags)
            ? domain_tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
            : [];

        // Check if group exists
        const groups = await query(
            'SELECT group_id FROM project_groups WHERE group_id = $1',
            [group_id]
        );

        if (groups.length === 0) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        // Check if group already has 3 proposals
        const existingCount = await query(
            'SELECT COUNT(*) as count FROM project_proposals WHERE group_id = $1',
            [group_id]
        );

        if (parseInt(existingCount[0].count) >= 3) {
            res.status(409).json({
                error: 'Group already has 3 proposals. Delete or update existing ones.',
            });
            return;
        }

        // Check if this priority is already taken
        const priorityTaken = await query(
            'SELECT proposal_id FROM project_proposals WHERE group_id = $1 AND priority = $2',
            [group_id, priority]
        );

        if (priorityTaken.length > 0) {
            res.status(409).json({
                error: `Priority ${priority} is already taken. Choose a different priority.`,
                proposal_id: priorityTaken[0].proposal_id
            });
            return;
        }

        // Create proposal
        const result = await query(
            `INSERT INTO project_proposals (group_id, title, domain_tags, priority, status, is_approved) 
             VALUES ($1, $2, $3, $4, 'PENDING', false)
             RETURNING proposal_id, group_id, title, domain_tags, priority, status, rejection_reason, is_approved, created_at`,
            [group_id, title, tags, priority]
        );

        const proposal = result[0];

        res.status(201).json({
            message: 'Proposal submitted successfully',
            proposal
        });
    } catch (error) {
        console.error('Submit proposal error:', error);
        res.status(500).json({ error: 'Failed to submit proposal' });
    }
}

// Get proposals for a group
export async function getProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id } = req.params;

        const proposals = await query(
            `SELECT 
                proposal_id,
                group_id,
                title,
                domain_tags,
                priority,
                status,
                rejection_reason,
                is_approved,
                created_at,
                updated_at
             FROM project_proposals
             WHERE group_id = $1
             ORDER BY priority ASC`,
            [group_id]
        );

        res.status(200).json({
            group_id,
            total_proposals: proposals.length,
            proposals
        });
    } catch (error) {
        console.error('Get proposals error:', error);
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
}

// Approve/Reject proposal (Coordinator/Admin only)
export async function approveProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { proposal_id } = req.params;
        const { is_approved } = req.body;

        if (typeof is_approved !== 'boolean') {
            res.status(400).json({ error: 'is_approved must be a boolean' });
            return;
        }

        // Get the proposal to find its group_id
        const proposalData = await query(
            'SELECT group_id FROM project_proposals WHERE proposal_id = $1',
            [proposal_id]
        );

        if (proposalData.length === 0) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        const groupId = proposalData[0].group_id;

        // Update the proposal status
        const newStatus = is_approved ? 'APPROVED' : 'REJECTED';
        const result = await query(
            `UPDATE project_proposals 
             SET is_approved = $1, status = $2, updated_at = CURRENT_TIMESTAMP
             WHERE proposal_id = $3
             RETURNING proposal_id, group_id, title, priority, status, is_approved, updated_at`,
            [is_approved, newStatus, proposal_id]
        );

        const proposal = result[0];

        // If approved, auto-reject the other 2 proposals for the same group
        if (is_approved) {
            await query(
                `UPDATE project_proposals 
                 SET status = 'REJECTED', is_approved = false, rejection_reason = 'Another proposal was approved', updated_at = CURRENT_TIMESTAMP
                 WHERE group_id = $1 AND proposal_id != $2 AND status = 'PENDING'`,
                [groupId, proposal_id]
            );
        }

        res.status(200).json({
            message: `Proposal ${is_approved ? 'approved' : 'rejected'}`,
            proposal
        });
    } catch (error) {
        console.error('Approve proposal error:', error);
        res.status(500).json({ error: 'Failed to approve/reject proposal' });
    }
}

// Reject proposal with reason (Coordinator/Admin only)
export async function rejectProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { proposal_id } = req.params;
        const { rejection_reason } = req.body;

        const result = await query(
            `UPDATE project_proposals 
             SET status = 'REJECTED', is_approved = false, rejection_reason = $1, updated_at = CURRENT_TIMESTAMP
             WHERE proposal_id = $2
             RETURNING proposal_id, group_id, title, priority, status, rejection_reason, updated_at`,
            [rejection_reason || 'Rejected by coordinator', proposal_id]
        );

        if (result.length === 0) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        res.status(200).json({
            message: 'Proposal rejected',
            proposal: result[0]
        });
    } catch (error) {
        console.error('Reject proposal error:', error);
        res.status(500).json({ error: 'Failed to reject proposal' });
    }
}

// Request revision on proposal (Coordinator/Admin only)
export async function requestRevision(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { proposal_id } = req.params;
        const { revision_comment } = req.body;

        const result = await query(
            `UPDATE project_proposals 
             SET status = 'REVISION_REQUESTED', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP
             WHERE proposal_id = $2
             RETURNING proposal_id, group_id, title, priority, status, rejection_reason, updated_at`,
            [revision_comment || 'Revision requested', proposal_id]
        );

        if (result.length === 0) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        res.status(200).json({
            message: 'Revision requested',
            proposal: result[0]
        });
    } catch (error) {
        console.error('Request revision error:', error);
        res.status(500).json({ error: 'Failed to request revision' });
    }
}

// Update proposal
export async function updateProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { proposal_id } = req.params;
        const { title, domain_tags, priority } = req.body;

        const tags = Array.isArray(domain_tags)
            ? domain_tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
            : undefined;

        // Validate priority if provided
        if (priority !== undefined && ![1, 2, 3].includes(priority)) {
            res.status(400).json({ error: 'priority must be 1, 2, or 3' });
            return;
        }

        // If priority is being changed, check if it's already taken
        if (priority !== undefined) {
            const proposalData = await query(
                'SELECT group_id FROM project_proposals WHERE proposal_id = $1',
                [proposal_id]
            );

            if (proposalData.length === 0) {
                res.status(404).json({ error: 'Proposal not found' });
                return;
            }

            const groupId = proposalData[0].group_id;

            const priorityTaken = await query(
                'SELECT proposal_id FROM project_proposals WHERE group_id = $1 AND priority = $2 AND proposal_id != $3',
                [groupId, priority, proposal_id]
            );

            if (priorityTaken.length > 0) {
                res.status(409).json({
                    error: `Priority ${priority} is already taken by another proposal.`,
                });
                return;
            }
        }

        let sql = 'UPDATE project_proposals SET updated_at = CURRENT_TIMESTAMP, status = \'PENDING\'';
        const params: unknown[] = [];
        let paramCount = 1;

        if (title) {
            sql += `, title = $${paramCount}`;
            params.push(title);
            paramCount++;
        }

        if (tags) {
            sql += `, domain_tags = $${paramCount}`;
            params.push(tags);
            paramCount++;
        }

        if (priority !== undefined) {
            sql += `, priority = $${paramCount}`;
            params.push(priority);
            paramCount++;
        }

        sql += ` WHERE proposal_id = $${paramCount} RETURNING proposal_id, title, domain_tags, priority, status, updated_at`;
        params.push(proposal_id);

        const result = await query(sql, params);

        if (result.length === 0) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        res.status(200).json({
            message: 'Proposal updated',
            proposal: result[0]
        });
    } catch (error) {
        console.error('Update proposal error:', error);
        res.status(500).json({ error: 'Failed to update proposal' });
    }
}

// Delete proposal
export async function deleteProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { proposal_id } = req.params;

        const result = await query(
            'DELETE FROM project_proposals WHERE proposal_id = $1 RETURNING proposal_id',
            [proposal_id]
        );

        if (result.length === 0) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        res.status(200).json({
            message: 'Proposal deleted',
            proposal_id
        });
    } catch (error) {
        console.error('Delete proposal error:', error);
        res.status(500).json({ error: 'Failed to delete proposal' });
    }
};

export const checkPlagiarism = async (req: Request, res: Response): Promise<void> => {
    try {
        const { proposal_id } = req.params;
        
        // Dummy simulation: generate a random score between 0 and 40
        const fakeScore = Math.floor(Math.random() * 41);
        
        const result = await query(
            `UPDATE project_proposals SET plagiarism_score = $1, updated_at = CURRENT_TIMESTAMP WHERE proposal_id = $2 RETURNING *`,
            [fakeScore, proposal_id]
        );
        
        if (result.length === 0) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }
        
        res.json(result[0]);
    } catch (error) {
        console.error('Error in checkPlagiarism:', error);
        res.status(500).json({ error: 'Failed to check plagiarism' });
    }
};
