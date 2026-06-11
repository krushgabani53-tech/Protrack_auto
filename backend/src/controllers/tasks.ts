import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id } = req.params;
        const tasks = await query(
            `SELECT t.*, u.full_name as assignee_name 
             FROM group_tasks t
             LEFT JOIN users u ON t.assigned_to = u.user_id
             WHERE t.group_id = $1
             ORDER BY t.created_at DESC`,
            [group_id]
        );
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Fetch tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
}

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { group_id, title, assigned_to } = req.body;
        const result = await query(
            `INSERT INTO group_tasks (group_id, title, assigned_to)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [group_id, title, assigned_to || null]
        );
        res.status(201).json(result[0]);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
}

export async function updateTaskStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { task_id } = req.params;
        const { status } = req.body;
        const result = await query(
            `UPDATE group_tasks SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE task_id = $2
             RETURNING *`,
            [status, task_id]
        );
        if (result.length === 0) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { task_id } = req.params;
        await query(
            `DELETE FROM group_tasks WHERE task_id = $1`,
            [task_id]
        );
        res.status(200).json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
}
