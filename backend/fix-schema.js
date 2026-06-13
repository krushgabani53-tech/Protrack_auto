import { query } from './src/config/database.js';

async function fixSchema() {
    try {
        console.log('Adding approval_stage to project_proposals...');
        await query(`ALTER TABLE project_proposals ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'PENDING'`);
        
        console.log('Copying status to approval_stage...');
        await query(`UPDATE project_proposals SET approval_stage = status WHERE approval_stage IS NULL OR approval_stage = 'PENDING'`);

        console.log('Removing constraint on status...');
        await query(`ALTER TABLE project_proposals DROP CONSTRAINT IF EXISTS project_proposals_status_check`);

        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixSchema();
