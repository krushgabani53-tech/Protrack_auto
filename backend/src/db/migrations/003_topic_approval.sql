-- ============================================================
-- Migration 003: SPPU-style 3-Priority Topic Approval Workflow
-- ============================================================

-- Add priority + approval stage to existing proposals
ALTER TABLE project_proposals
  ADD COLUMN IF NOT EXISTS priority         INT NOT NULL DEFAULT 1 CHECK (priority IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS approval_stage   VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS abstract         TEXT,
  ADD COLUMN IF NOT EXISTS objectives       TEXT,
  ADD COLUMN IF NOT EXISTS technology_stack TEXT[];

-- Drop the old unique-one-per-group constraint so each group can have 3 rows
ALTER TABLE project_proposals
  DROP CONSTRAINT IF EXISTS project_proposals_group_id_key;

-- Enforce: each group can have at most one proposal per priority (1, 2, 3)
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_group_priority
  ON project_proposals(group_id, priority);

-- Valid approval_stage values:
-- PENDING | GUIDE_APPROVED | GUIDE_REJECTED |
-- COMMITTEE_APPROVED | COMMITTEE_REJECTED |
-- COORDINATOR_APPROVED | APPROVED | REJECTED
-- (We use strings so no ALTER TYPE needed when adding stages)

-- Per-stage decision history with comments / rejection reason
CREATE TABLE IF NOT EXISTS topic_approvals (
    approval_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id   UUID NOT NULL REFERENCES project_proposals(proposal_id) ON DELETE CASCADE,
    stage         VARCHAR(30) NOT NULL,          -- 'GUIDE' | 'COMMITTEE' | 'COORDINATOR'
    decision      VARCHAR(20) NOT NULL,          -- 'APPROVED' | 'REJECTED'
    decided_by    UUID REFERENCES users(user_id) ON DELETE SET NULL,
    comments      TEXT,
    rejection_reason TEXT,
    plagiarism_score INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_topic_approvals_proposal ON topic_approvals(proposal_id);
CREATE INDEX IF NOT EXISTS idx_topic_approvals_stage    ON topic_approvals(stage);
CREATE INDEX IF NOT EXISTS idx_topic_approvals_by       ON topic_approvals(decided_by);

-- Allow querying "active" proposal per group (coordinator approved or currently progressing)
CREATE INDEX IF NOT EXISTS idx_proposals_group_stage
  ON project_proposals(group_id, approval_stage);
