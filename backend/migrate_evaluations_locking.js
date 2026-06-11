/**
 * Migration script to add evaluation locking mechanism
 * Run this script to add is_locked, locked_by, locked_at, and evaluator_id columns
 * 
 * Usage: node migrate_evaluations_locking.js
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
        console.log('Starting migration for evaluations locking mechanism...\n');

        // Start transaction
        await client.query('BEGIN');

        // Step 1: Add evaluator_id column
        console.log('1. Adding evaluator_id column...');
        await client.query(`
            ALTER TABLE evaluations 
            ADD COLUMN IF NOT EXISTS evaluator_id UUID REFERENCES users(user_id);
        `);
        console.log('   ✓ evaluator_id column added\n');

        // Step 2: Add is_locked column
        console.log('2. Adding is_locked column...');
        await client.query(`
            ALTER TABLE evaluations 
            ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
        `);
        console.log('   ✓ is_locked column added\n');

        // Step 3: Add locked_by column
        console.log('3. Adding locked_by column...');
        await client.query(`
            ALTER TABLE evaluations 
            ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES users(user_id);
        `);
        console.log('   ✓ locked_by column added\n');

        // Step 4: Add locked_at column
        console.log('4. Adding locked_at column...');
        await client.query(`
            ALTER TABLE evaluations 
            ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;
        `);
        console.log('   ✓ locked_at column added\n');

        // Step 5: Create index for is_locked for faster queries
        console.log('5. Creating index on is_locked...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_evaluations_locked 
            ON evaluations(is_locked);
        `);
        console.log('   ✓ Index created\n');

        // Step 6: Create index on evaluator_id
        console.log('6. Creating index on evaluator_id...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator 
            ON evaluations(evaluator_id);
        `);
        console.log('   ✓ Index created\n');

        // Commit transaction
        await client.query('COMMIT');

        console.log('✅ Migration completed successfully!\n');
        console.log('Summary of changes:');
        console.log('  - Added evaluator_id column (references users)');
        console.log('  - Added is_locked column (boolean, default false)');
        console.log('  - Added locked_by column (references users)');
        console.log('  - Added locked_at column (timestamp)');
        console.log('  - Created indexes for performance');
        console.log('\nEvaluation locking mechanism is now active!\n');

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
