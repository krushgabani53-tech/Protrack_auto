import { readFileSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Direct pool import
import('pg').then(({ Pool }) => {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'protrack_auto',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    async function initializeDatabase() {
        try {
            console.log('🔧 Initializing ProTrack-Auto database...');
            
            // Read the SQL initialization script
            const sqlPath = join(__dirname, '..', 'db', 'init.sql');
            const sql = readFileSync(sqlPath, 'utf-8');
            
            // Split by semicolon to execute statements individually
            const statements = sql.split(';').filter(stmt => stmt.trim());
            
            const client = await pool.connect();
            try {
                for (const statement of statements) {
                    if (statement.trim()) {
                        await client.query(statement);
                    }
                }
                console.log('✓ Database schema initialized successfully');
            } finally {
                client.release();
            }
            
            // Close the pool
            await pool.end();
            console.log('✓ Database initialization complete');
            process.exit(0);
        } catch (error) {
            console.error('✗ Database initialization failed:', error);
            process.exit(1);
        }
    }

    initializeDatabase();
});
