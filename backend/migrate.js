import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DB_URL
});

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                group_id UUID REFERENCES project_groups(group_id) ON DELETE CASCADE,
                sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                is_announcement BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_chat_group ON chat_messages(group_id);
            CREATE INDEX IF NOT EXISTS idx_chat_announcement ON chat_messages(is_announcement);
        `);
        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit(0);
    }
}

migrate();
