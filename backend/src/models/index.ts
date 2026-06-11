// ============================================================
// ProTrack System - TypeScript Interfaces
// Aligned with the PostgreSQL schema defined in init.sql
// ============================================================

// ---- Enums (mirror PostgreSQL ENUM types) -------------------

export type UserRole = 'STUDENT' | 'GUIDE' | 'COORDINATOR' | 'COMMITTEE';
export type GroupStatus = 'FORMING' | 'WAITING_ALLOCATION' | 'ACTIVE';
export type LogStatus = 'PENDING' | 'APPROVED' | 'NEEDS_REVISION';
export type ReviewPhase = 'REVIEW_1' | 'REVIEW_2' | 'REVIEW_3' | 'FINAL';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

// ---- Core Tables -------------------------------------------

export interface User {
    user_id: string;
    email: string;
    full_name: string;
    role: UserRole;
    created_at: Date;
    updated_at: Date;
}

export interface StudentProfile {
    student_id: string;        // FK → users.user_id
    prn_no: string;
    roll_no: string;
    batch_year: number;
    created_at: Date;
}

export interface FacultyProfile {
    faculty_id: string;        // FK → users.user_id
    expertise_tags: string[];
    max_workload: number;
    current_workload: number;
    created_at: Date;
}

// ---- Whitelist Tables --------------------------------------

export interface StudentWhitelistEntry {
    id: string;
    prn_no: string;
    email: string;
    full_name: string;
    is_claimed: boolean;
    created_at: Date;
}

export interface FacultyWhitelistEntry {
    id: string;
    email: string;
    employee_id: string | null;
    full_name: string;
    role: UserRole;
    is_claimed: boolean;
    created_at: Date;
}

// ---- Project Entities --------------------------------------

export interface ProjectGroup {
    group_id: string;
    group_name: string;
    guide_id: string | null;   // FK → faculty_profiles.faculty_id
    status: GroupStatus;
    created_at: Date;
    updated_at: Date;
}

export interface GroupMember {
    group_id: string;          // FK → project_groups.group_id
    student_id: string;        // FK → student_profiles.student_id
    is_leader: boolean;
    created_at: Date;
}

export interface ProjectProposal {
    proposal_id: string;
    group_id: string;          // FK → project_groups.group_id
    title: string;
    domain_tags: string[];
    is_approved: boolean;
    plagiarism_score: number | null;
    created_at: Date;
    updated_at: Date;
}

// ---- Activity Entities -------------------------------------

export interface Logbook {
    log_id: string;
    group_id: string;          // FK → project_groups.group_id
    week_number: number;
    work_summary: string;
    evidence_url: string | null;
    guide_status: LogStatus;
    guide_remarks: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface GroupTask {
    task_id: string;
    group_id: string;          // FK → project_groups.group_id
    title: string;
    status: TaskStatus;
    assigned_to: string | null; // FK → student_profiles.student_id (= users.user_id)
    created_at: Date;
    updated_at: Date;
}

export interface GroupResource {
    resource_id: string;
    group_id: string;          // FK → project_groups.group_id
    title: string;
    url: string;
    uploaded_by: string | null; // FK → student_profiles.student_id
    created_at: Date;
}

// ---- Evaluation Entities -----------------------------------

export interface Evaluation {
    eval_id: string;
    group_id: string;          // FK → project_groups.group_id
    phase: ReviewPhase;
    rubric_scores: Record<string, number>;
    total_marks: number;
    created_at: Date;
    updated_at: Date;
}

export interface PeerEvaluation {
    eval_id: string;
    group_id: string;          // FK → project_groups.group_id
    evaluator_id: string;      // FK → student_profiles.student_id
    evaluatee_id: string;      // FK → student_profiles.student_id
    score: number;             // 1–5
    comments: string | null;
    created_at: Date;
}

export interface PresentationSchedule {
    schedule_id: string;
    group_id: string;          // FK → project_groups.group_id
    phase: ReviewPhase;
    presentation_time: Date;
    venue: string;
    created_at: Date;
    updated_at: Date;
}

export interface RubricTemplate {
    template_id: string;
    name: string;
    schema: Record<string, unknown>;
    created_at: Date;
}

// ---- Messaging Entities ------------------------------------

export interface ChatMessage {
    message_id: string;
    group_id: string | null;   // FK → project_groups.group_id
    sender_id: string;         // FK → users.user_id
    content: string;
    is_announcement: boolean;
    is_committee_only: boolean;
    created_at: Date;
}

export interface StudentNote {
    note_id: string;
    student_id: string;        // FK → student_profiles.student_id
    content: string;
    updated_at: Date;
}

// ---- JWT / Auth Payload ------------------------------------

export interface JwtPayload {
    user_id: string;
    email: string;
    role: UserRole;
}
