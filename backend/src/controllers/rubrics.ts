import { Request, Response } from 'express';
import { query } from '../config/database.js';

export const saveRubricTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, schema } = req.body;
        
        const result = await query(
            `INSERT INTO rubric_templates (name, schema) VALUES ($1, $2)
             ON CONFLICT (name) DO UPDATE SET schema = EXCLUDED.schema, created_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [name, JSON.stringify(schema)]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving rubric:', error);
        res.status(500).json({ error: 'Failed to save rubric' });
    }
};

export const getRubricTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await query(`SELECT * FROM rubric_templates ORDER BY created_at DESC`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching rubrics:', error);
        res.status(500).json({ error: 'Failed to fetch rubrics' });
    }
};
