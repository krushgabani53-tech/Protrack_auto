import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Direct pool import
import('pg').then(async ({ Pool }) => {
    const bcrypt = await import('bcryptjs');
    
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'protrack_auto',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    async function hashPassword(password: string): Promise<string> {
        return bcrypt.default.hash(password, 10);
    }

    async function seedDatabase() {
        try {
            console.log('🌱 Seeding ProTrack-Auto database with full demo data...');

            // Clear existing data (optional, but good for idempotent seeds)
            await pool.query(`
                TRUNCATE TABLE evaluations, logbooks, project_proposals, group_members, project_groups CASCADE;
            `);
            // Not truncating users by default, but we can safely insert them if not exists.

            // 1. Users
            const testUsers = [
                { email: 'student1@example.com', password: 'Student@123', full_name: 'Rahul Sharma', role: 'STUDENT', prn_no: 'PRN001', roll_no: 'CS001', batch_year: 2024 },
                { email: 'student2@example.com', password: 'Student@123', full_name: 'Priya Desai', role: 'STUDENT', prn_no: 'PRN002', roll_no: 'CS002', batch_year: 2024 },
                { email: 'student3@example.com', password: 'Student@123', full_name: 'Amit Patel', role: 'STUDENT', prn_no: 'PRN003', roll_no: 'CS003', batch_year: 2024 },
                { email: 'guide1@example.com', password: 'Guide@123', full_name: 'Dr. Anita Kumar', role: 'GUIDE', expertise_tags: ['AI', 'Machine Learning', 'Data Science'] },
                { email: 'guide2@example.com', password: 'Guide@123', full_name: 'Prof. Rajesh Mehta', role: 'GUIDE', expertise_tags: ['Web Development', 'React', 'Node.js'] },
                { email: 'coordinator@example.com', password: 'Coordinator@123', full_name: 'Dr. Sunita Patil', role: 'COORDINATOR' },
                { email: 'committee@example.com', password: 'Committee@123', full_name: 'Prof. Vikram Singh', role: 'COMMITTEE' }
            ];

            const userIds: Record<string, string> = {};

            for (const user of testUsers) {
                const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [user.email]);
                
                if (existing.rows.length > 0) {
                    userIds[user.email] = existing.rows[0].user_id;
                    continue;
                }

                const passwordHash = await hashPassword(user.password);
                const userResult = await pool.query(
                    'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING user_id',
                    [user.email, passwordHash, user.full_name, user.role]
                );

                const userId = userResult.rows[0].user_id;
                userIds[user.email] = userId;

                if (user.role === 'STUDENT') {
                    await pool.query(
                        'INSERT INTO student_profiles (student_id, prn_no, roll_no, batch_year) VALUES ($1, $2, $3, $4)',
                        [userId, user.prn_no, user.roll_no, user.batch_year]
                    );
                } else if (user.role === 'GUIDE') {
                    await pool.query(
                        'INSERT INTO faculty_profiles (faculty_id, expertise_tags) VALUES ($1, $2)',
                        [userId, user.expertise_tags || []]
                    );
                }
            }
            console.log('✓ Users ensured.');

            // 2. Project Groups
            const grp1 = await pool.query(
                "INSERT INTO project_groups (group_name, guide_id, status) VALUES ($1, $2, 'ACTIVE') RETURNING group_id",
                ['AI Attendance System', userIds['guide1@example.com']]
            );
            const group1Id = grp1.rows[0].group_id;

            const grp2 = await pool.query(
                "INSERT INTO project_groups (group_name, guide_id, status) VALUES ($1, $2, 'ACTIVE') RETURNING group_id",
                ['WebRTC Collaboration Tool', userIds['guide2@example.com']]
            );
            const group2Id = grp2.rows[0].group_id;

            console.log('✓ Groups created.');

            // 3. Group Members
            await pool.query('INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, true)', [group1Id, userIds['student1@example.com']]);
            await pool.query('INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, false)', [group1Id, userIds['student2@example.com']]);
            await pool.query('INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, true)', [group2Id, userIds['student3@example.com']]);

            console.log('✓ Members assigned.');

            // 4. Logbooks
            await pool.query(`
                INSERT INTO logbooks (group_id, week_number, work_summary, guide_status, guide_remarks) VALUES 
                ($1, 1, 'Completed literature survey and architecture design.', 'APPROVED', 'Good initial start.'),
                ($1, 2, 'Implemented the database schema and user authentication.', 'PENDING', NULL),
                ($2, 1, 'Set up the Next.js project with TailwindCSS.', 'APPROVED', 'Ensure you use strict TypeScript.'),
                ($2, 2, 'Working on WebSocket integration. Currently stuck on a CORS issue.', 'NEEDS_REVISION', 'Please check the allowed origins in your Express server config.')
            `, [group1Id, group2Id]);

            console.log('✓ Logbooks seeded.');

            // 5. Evaluations (For Committee Results Leaderboard)
            await pool.query(`
                INSERT INTO evaluations (group_id, phase, rubric_scores, total_marks) VALUES 
                ($1, 'FINAL', '{"Literature Survey": 4, "Problem Statement": 4.5, "Technical Design": 18, "Implementation": 28, "Testing & Documentation": 13, "Presentation": 9}', 89.5),
                ($2, 'FINAL', '{"Literature Survey": 3, "Problem Statement": 4, "Technical Design": 15, "Implementation": 22, "Testing & Documentation": 10, "Presentation": 8}', 72.0)
            `, [group1Id, group2Id]);

            console.log('✓ Evaluations seeded.');

            console.log('\nTest Credentials:');
            console.log('─'.repeat(50));
            testUsers.forEach(u => {
                console.log(`${u.role.padEnd(12)} | ${u.email.padEnd(25)} | ${u.password}`);
            });
            console.log('─'.repeat(50));

            process.exit(0);
        } catch (error) {
            console.error('✗ Database seeding failed:', error);
            process.exit(1);
        }
    }

    seedDatabase();
});
