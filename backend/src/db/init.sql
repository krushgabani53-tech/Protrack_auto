-- Drop existing types and tables if they exist (for clean setup)
DROP TABLE IF EXISTS topic_approvals CASCADE;
DROP TABLE IF EXISTS po_pso_mappings CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS rubric_templates CASCADE;
DROP TABLE IF EXISTS student_notes CASCADE;
DROP TABLE IF EXISTS group_resources CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS peer_evaluations CASCADE;
DROP TABLE IF EXISTS group_tasks CASCADE;
DROP TABLE IF EXISTS presentation_schedules CASCADE;
DROP TABLE IF EXISTS logbooks CASCADE;
DROP TABLE IF EXISTS project_proposals CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS allocation_audit CASCADE;
DROP TABLE IF EXISTS guide_ratings CASCADE;
DROP TABLE IF EXISTS global_settings CASCADE;
DROP TABLE IF EXISTS project_groups CASCADE;
DROP TABLE IF EXISTS faculty_profiles CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS batch_milestones CASCADE;

DROP TYPE IF EXISTS review_phase CASCADE;
DROP TYPE IF EXISTS log_status CASCADE;
DROP TYPE IF EXISTS group_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TABLE IF EXISTS student_whitelist CASCADE;
DROP TABLE IF EXISTS faculty_whitelist CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('STUDENT', 'GUIDE', 'COORDINATOR', 'COMMITTEE');
CREATE TYPE group_status AS ENUM ('FORMING', 'WAITING_ALLOCATION', 'ACTIVE');
CREATE TYPE log_status AS ENUM ('PENDING', 'APPROVED', 'NEEDS_REVISION');
CREATE TYPE review_phase AS ENUM ('REVIEW_1', 'REVIEW_2', 'REVIEW_3', 'FINAL');
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- Create users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create student_profiles table
CREATE TABLE student_profiles (
    student_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    prn_no VARCHAR(50) UNIQUE NOT NULL,
    roll_no VARCHAR(50) NOT NULL,
    batch_year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create student_whitelist table
CREATE TABLE student_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prn_no VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create faculty_whitelist table
CREATE TABLE faculty_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create faculty_profiles table
CREATE TABLE faculty_profiles (
    faculty_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    expertise_tags TEXT[] NOT NULL DEFAULT '{}',
    max_workload INT DEFAULT 4,
    current_workload INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_groups table
CREATE TABLE project_groups (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(255) UNIQUE NOT NULL,
    guide_id UUID REFERENCES faculty_profiles(faculty_id) ON DELETE SET NULL,
    status group_status DEFAULT 'FORMING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create allocation_audit table
CREATE TABLE allocation_audit (
    audit_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    guide_id        UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    allocation_type VARCHAR(20) NOT NULL DEFAULT 'AUTO'
                    CHECK (allocation_type IN ('AUTO', 'MANUAL', 'OVERRIDE', 'UNASSIGN')),
    score           NUMERIC(5,2),
    score_breakdown JSONB,
    notes           TEXT,
    allocated_by    UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_allocation_audit_group ON allocation_audit(group_id);
CREATE INDEX idx_allocation_audit_guide ON allocation_audit(guide_id);

-- Create guide_ratings table
CREATE TABLE guide_ratings (
    rating_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    student_id  UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    group_id    UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments    TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, guide_id, group_id)
);
CREATE INDEX idx_guide_ratings_guide ON guide_ratings(guide_id);

-- Create global_settings table
CREATE TABLE global_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       JSONB NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO global_settings (key, value) VALUES
    ('max_groups_per_guide', '6'),
    ('logbook_window_days', '7'),
    ('batch_year', '2025'),
    ('institute_name', '"My Engineering College"'),
    ('smtp_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

-- Create group_members table
CREATE TABLE group_members (
    group_id UUID REFERENCES project_groups(group_id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    is_leader BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, student_id)
);

-- Create project_proposals table
CREATE TABLE project_proposals (
    proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    domain_tags TEXT[] NOT NULL DEFAULT '{}',
    priority INT DEFAULT 1 CHECK (priority IN (1, 2, 3)),
    status VARCHAR(20) DEFAULT 'PENDING',
    approval_stage VARCHAR(50) DEFAULT 'PENDING',
    rejection_reason TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    plagiarism_score INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, priority)
);

-- Create topic_approvals table
CREATE TABLE topic_approvals (
    approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES project_proposals(proposal_id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    decision VARCHAR(50) NOT NULL,
    decided_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    comments TEXT,
    rejection_reason TEXT,
    plagiarism_score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create logbooks table
CREATE TABLE logbooks (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    work_summary TEXT NOT NULL,
    evidence_url VARCHAR(500),
    guide_status log_status DEFAULT 'PENDING',
    guide_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create evaluations table
CREATE TABLE evaluations (
    eval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    phase review_phase NOT NULL,
    rubric_scores JSONB NOT NULL,
    total_marks NUMERIC(5, 2) NOT NULL,
    evaluator_id UUID REFERENCES users(user_id),
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by UUID REFERENCES users(user_id),
    locked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, phase)
);

-- Create presentation_schedules table
CREATE TABLE presentation_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    phase review_phase NOT NULL,
    presentation_time TIMESTAMP NOT NULL,
    venue VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, phase)
);

-- Create group_tasks table
CREATE TABLE group_tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status task_status DEFAULT 'TODO',
    assigned_to UUID REFERENCES student_profiles(student_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create peer_evaluations table
CREATE TABLE peer_evaluations (
    eval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    evaluatee_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(evaluator_id, evaluatee_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_students_prn ON student_profiles(prn_no);
CREATE INDEX idx_students_roll ON student_profiles(roll_no);
CREATE INDEX idx_groups_guide ON project_groups(guide_id);
CREATE INDEX idx_members_student ON group_members(student_id);
CREATE INDEX idx_members_group ON group_members(group_id);
CREATE INDEX idx_proposals_group ON project_proposals(group_id);
CREATE INDEX idx_logbooks_group ON logbooks(group_id);
CREATE INDEX idx_evaluations_group ON evaluations(group_id);
CREATE INDEX idx_schedules_group ON presentation_schedules(group_id);
CREATE INDEX idx_tasks_group ON group_tasks(group_id);
CREATE INDEX idx_peereval_group ON peer_evaluations(group_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_faculty_whitelist_email ON faculty_whitelist(email);
CREATE INDEX idx_faculty_whitelist_role ON faculty_whitelist(role);

-- Create chat_messages table
CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES project_groups(group_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_announcement BOOLEAN DEFAULT FALSE,
    is_committee_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_group ON chat_messages(group_id);
CREATE INDEX idx_chat_announcement ON chat_messages(is_announcement);

-- Create group_resources table
CREATE TABLE group_resources (
    resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES student_profiles(student_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_resources_group ON group_resources(group_id);

-- Create student_notes table
CREATE TABLE student_notes (
    note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notes_student ON student_notes(student_id);

-- Create rubric_templates table
CREATE TABLE rubric_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    schema JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create batch_milestones table
CREATE TABLE batch_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_year INT NOT NULL,
    milestone_key VARCHAR(50) NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(batch_year, milestone_key)
);
CREATE INDEX idx_milestones_batch ON batch_milestones(batch_year);
CREATE INDEX idx_milestones_key ON batch_milestones(milestone_key);
CREATE INDEX idx_milestones_date ON batch_milestones(due_date);

-- Create po_pso_mappings table
CREATE TABLE po_pso_mappings (
    mapping_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    criterion_id  VARCHAR(50) NOT NULL,
    mapping_type  VARCHAR(10) NOT NULL CHECK (mapping_type IN ('PO','PSO')),
    outcome_key   VARCHAR(10) NOT NULL,
    level         INT NOT NULL CHECK (level >= 0 AND level <= 3),
    updated_by    UUID REFERENCES users(user_id),
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(criterion_id, mapping_type, outcome_key)
);
