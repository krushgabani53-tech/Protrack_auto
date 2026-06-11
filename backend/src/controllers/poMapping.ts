import { Response } from 'express';
import { query } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getMappings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const rows = await query('SELECT * FROM po_pso_mappings');
        
        // Convert rows to matrices
        const poMatrix: Record<string, Record<string, number>> = {};
        const psoMatrix: Record<string, Record<string, number>> = {};

        rows.forEach((row: any) => {
            if (row.mapping_type === 'PO') {
                if (!poMatrix[row.criterion_id]) poMatrix[row.criterion_id] = {};
                poMatrix[row.criterion_id][row.outcome_key] = row.level;
            } else if (row.mapping_type === 'PSO') {
                if (!psoMatrix[row.criterion_id]) psoMatrix[row.criterion_id] = {};
                psoMatrix[row.criterion_id][row.outcome_key] = row.level;
            }
        });

        res.status(200).json({ poMatrix, psoMatrix });
    } catch (error) {
        console.error('Error getting PO/PSO mappings:', error);
        res.status(500).json({ error: 'Failed to fetch mappings' });
    }
}

export async function saveMapping(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const { criterion_id, mapping_type, outcome_key, level } = req.body;
        const user_id = req.user?.user_id;

        if (!criterion_id || !mapping_type || !outcome_key || level === undefined) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        await query(
            `INSERT INTO po_pso_mappings (criterion_id, mapping_type, outcome_key, level, updated_by)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (criterion_id, mapping_type, outcome_key)
             DO UPDATE SET level = EXCLUDED.level, updated_by = EXCLUDED.updated_by, updated_at = CURRENT_TIMESTAMP`,
            [criterion_id, mapping_type, outcome_key, level, user_id]
        );

        res.status(200).json({ message: 'Mapping saved successfully' });
    } catch (error) {
        console.error('Error saving mapping:', error);
        res.status(500).json({ error: 'Failed to save mapping' });
    }
}

export async function resetMappings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        await query('DELETE FROM po_pso_mappings');
        res.status(200).json({ message: 'Mappings reset successfully' });
    } catch (error) {
        console.error('Error resetting mappings:', error);
        res.status(500).json({ error: 'Failed to reset mappings' });
    }
}
