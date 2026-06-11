-- ============================================================
-- Migration 001: Schema Fixes for ProTrack System
-- Date: 2026-06-10
-- Description:
--   1. Create missing faculty_whitelist table
--   2. Add full_name column to users table
--   3. Backfill full_name from student_whitelist for existing users
-- ============================================================

-- 1. Create the missing faculty_whitelist table
CREATE TABLE IF NOT EXISTS faculty_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faculty_whitelist_email ON faculty_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_faculty_whitelist_role ON faculty_whitelist(role);

-- 2. Add full_name column to users table (safe, no-op if already exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- 3. Backfill full_name for existing student users from student_whitelist (via email bridge)
UPDATE users u
SET full_name = sw.full_name
FROM student_whitelist sw
WHERE u.email = sw.email
  AND u.full_name IS NULL;

-- 4. Backfill full_name for existing faculty/coordinator/committee users from faculty_whitelist
--    (This runs after we create faculty_whitelist, so existing data would need manual seeding.)
--    For any remaining NULL full_names, set a default placeholder.
UPDATE users u
SET full_name = COALESCE(u.full_name, split_part(u.email, '@', 1))
WHERE u.full_name IS NULL;

-- 5. Now enforce NOT NULL constraint
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;
