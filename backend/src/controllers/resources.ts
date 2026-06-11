import { Request, Response } from 'express';
import { query } from '../config/database.js';

export const getResources = async (req: Request, res: Response): Promise<void> => {
    try {
        const { group_id } = req.params;
        const result = await query(
            `SELECT r.*, u.email as uploaded_by_email 
             FROM group_resources r
             LEFT JOIN users u ON r.uploaded_by = u.user_id
             WHERE r.group_id = $1
             ORDER BY r.created_at DESC`,
            [group_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
};

export const createResource = async (req: Request, res: Response): Promise<void> => {
    try {
        const { group_id, title, url } = req.body;
        const user_id = (req as any).user.user_id;
        
        const result = await query(
            `INSERT INTO group_resources (group_id, title, url, uploaded_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [group_id, title, url, user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating resource:', error);
        res.status(500).json({ error: 'Failed to create resource' });
    }
};
