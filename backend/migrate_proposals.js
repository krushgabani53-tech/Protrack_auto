/**
 * Migration script to update project_proposals table for multi-topic support
 * Run this script to add priority, status, and rejection_reason columns to existing databases
 * 
 * Usage: node migrate_proposals.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'protrack',
});

async function migrate() {
    const client = await pool.connect();
    
    try {
        console.log('Starting migration for project_proposals table...\n');

        // Start transaction
        await client.query('BEGIN');

        // Step 1: Add priority column
        console.log('1. Adding priority column...');
        await client.query(`
            ALTER TABLE project_proposals 
            ADD COLUMN IF NOT EXISTS priority INT DEFAULT 1;
        `);
        console.log('   ✓ Priority column added\n');

        // Step 2: Add status column
        console.log('2. Adding status column...');
        await client.query(`
            ALTER TABLE project_proposals 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';
        `);
        console.log('   ✓ Status column added\n');

        // Step 3: Add rejection_reason column
        console.log('3. Adding rejection_reason column...');
        await client.query(`
            ALTER TABLE project_proposals 
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
        `);
        console.log('   ✓ Rejection_reason column added\n');

        // Step 4: Update status based on is_approved for existing records
        console.log('4. Updating status for existing proposals...');
        await client.query(`
            UPDATE project_proposals 
            SET status = CASE 
                WHEN is_approved = true THEN 'APPROVED'
                WHEN is_approved = false THEN 'REJECTED'
                ELSE 'PENDING'
            END
            WHERE status = 'PENDING';
        `);
        console.log('   ✓ Status updated for existing proposals\n');

        // Step 5: Add CHECK constraint for priority
        console.log('5. Adding CHECK constraint for priority...');
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'project_proposals_priority_check'
                ) THEN
                    ALTER TABLE project_proposals 
                    ADD CONSTRAINT project_proposals_priority_check 
                    CHECK (priority IN (1, 2, 3));
                END IF;
            END $$;
        `);
        console.log('   ✓ Priority constraint added\n');

        // Step 6: Add CHECK constraint for status
        console.log('6. Adding CHECK constraint for status...');
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'project_proposals_status_check'
                ) THEN
                    ALTER TABLE project_proposals 
                    ADD CONSTRAINT project_proposals_status_check 
                    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'));
                END IF;
            END $$;
        `);
        console.log('   ✓ Status constraint added\n');

        // Step 7: Drop old UNIQUE constraint on group_id if it exists
        console.log('7. Updating UNIQUE constraint...');
        await client.query(`
            DO $$ 
            BEGIN
                -- Drop old constraint if exists
                IF EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'project_proposals_group_id_key'
                ) THEN
                    ALTER TABLE project_proposals 
                    DROP CONSTRAINT project_proposals_group_id_key;
                    RAISE NOTICE 'Dropped old group_id UNIQUE constraint';
                END IF;

                -- Add new composite UNIQUE constraint if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'project_proposals_group_id_priority_key'
                ) THEN
                    ALTER TABLE project_proposals 
                    ADD CONSTRAINT project_proposals_group_id_priority_key 
                    UNIQUE (group_id, priority);
                    RAISE NOTICE 'Added new (group_id, priority) UNIQUE constraint';
                END IF;
            END $$;
        `);
        console.log('   ✓ UNIQUE constraint updated\n');

        // Commit transaction
        await client.query('COMMIT');

        console.log('✅ Migration completed successfully!\n');
        console.log('Summary of changes:');
        console.log('  - Added priority column (1, 2, or 3)');
        console.log('  - Added status column (PENDING, APPROVED, REJECTED, REVISION_REQUESTED)');
        console.log('  - Added rejection_reason column');
        console.log('  - Updated UNIQUE constraint to (group_id, priority)');
        console.log('  - Groups can now submit up to 3 prioritized topics\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
migrate().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
