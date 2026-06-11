-- ============================================================
-- Migration 004: Milestone Management System
-- ============================================================

-- Global settings table (used by existing settings controller)
CREATE TABLE IF NOT EXISTS global_settings (
    key   VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL
);

-- Milestone definitions per batch year
-- Coordinator configures these for every academic year
CREATE TABLE IF NOT EXISTS milestones (
    milestone_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_year    INT NOT NULL,
    code          VARCHAR(10) NOT NULL,  -- 'M1' ... 'M8'
    label         VARCHAR(100) NOT NULL, -- 'Topic Selection', 'Synopsis' ...
    description   TEXT,
    deadline      DATE NOT NULL,
    reminder_days INT NOT NULL DEFAULT 7, -- send reminder N days before deadline
    sort_order    INT NOT NULL DEFAULT 1,
    created_by    UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (batch_year, code)
);
CREATE INDEX IF NOT EXISTS idx_milestones_batch ON milestones(batch_year);
CREATE INDEX IF NOT EXISTS idx_milestones_deadline ON milestones(deadline);

-- Per-group milestone completion status
CREATE TABLE IF NOT EXISTS group_milestone_status (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id  UUID NOT NULL REFERENCES milestones(milestone_id) ON DELETE CASCADE,
    group_id      UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING | SUBMITTED | APPROVED | REJECTED | OVERDUE
    submitted_at  TIMESTAMP,
    approved_at   TIMESTAMP,
    approved_by   UUID REFERENCES users(user_id) ON DELETE SET NULL,
    notes         TEXT,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (milestone_id, group_id)
);
CREATE INDEX IF NOT EXISTS idx_gms_milestone ON group_milestone_status(milestone_id);
CREATE INDEX IF NOT EXISTS idx_gms_group     ON group_milestone_status(group_id);
CREATE INDEX IF NOT EXISTS idx_gms_status    ON group_milestone_status(status);

-- Milestone reminder log (to avoid duplicate reminders)
CREATE TABLE IF NOT EXISTS milestone_reminder_log (
    log_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id  UUID NOT NULL REFERENCES milestones(milestone_id) ON DELETE CASCADE,
    group_id      UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    reminder_type VARCHAR(30) NOT NULL DEFAULT 'DEADLINE_APPROACHING',
    -- DEADLINE_APPROACHING | OVERDUE
    sent_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (milestone_id, group_id, reminder_type)  -- only one per type per pair
);

-- Seed default M1-M8 labels (coordinator can reconfigure deadlines)
-- These are inserted with batch_year=0 as a template; real years get created via API
INSERT INTO global_settings (key, value) VALUES 
    ('current_batch_year', '2024'),
    ('milestone_reminder_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
