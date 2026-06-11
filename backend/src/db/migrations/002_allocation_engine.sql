-- ============================================================
-- Migration 002: Smart Guide Allocation Engine
-- ============================================================

-- Student preference for a specific guide
ALTER TABLE project_groups
  ADD COLUMN IF NOT EXISTS preferred_guide_id UUID REFERENCES faculty_profiles(faculty_id) ON DELETE SET NULL;

-- Guide performance ratings (submitted by coordinator post-semester)
CREATE TABLE IF NOT EXISTS guide_ratings (
    rating_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_id    UUID NOT NULL REFERENCES faculty_profiles(faculty_id) ON DELETE CASCADE,
    rated_by    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating      NUMERIC(3,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments    TEXT,
    academic_year VARCHAR(10) NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY'),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guide_id, rated_by, academic_year)
);
CREATE INDEX IF NOT EXISTS idx_guide_ratings_guide ON guide_ratings(guide_id);

-- Allocation audit log — every assignment/override/unassignment is recorded
CREATE TABLE IF NOT EXISTS allocation_audit (
    audit_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id       UUID NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    guide_id       UUID REFERENCES faculty_profiles(faculty_id) ON DELETE SET NULL,
    action         VARCHAR(30) NOT NULL, -- 'AUTO_ASSIGNED' | 'MANUAL_OVERRIDE' | 'UNASSIGNED' | 'BATCH'
    performed_by   UUID REFERENCES users(user_id) ON DELETE SET NULL,
    score_breakdown JSONB,               -- snapshot of the scoring at time of allocation
    notes          TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_allocation_audit_group  ON allocation_audit(group_id);
CREATE INDEX IF NOT EXISTS idx_allocation_audit_guide  ON allocation_audit(guide_id);
CREATE INDEX IF NOT EXISTS idx_allocation_audit_action ON allocation_audit(action);
